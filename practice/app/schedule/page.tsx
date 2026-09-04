"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function ToothMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5.5c-1.6-1.4-3.9-2-6.2-1C3.9 5.4 3 7.9 3.4 10.4c.3 1.9.9 3.3 1.6 4.9.7 1.6 1.1 3.7 1.7 5.4.2.6.4 1.3 1 1.3.9 0 1-1.2 1.2-2.2.3-1.3.5-2.6 1.2-3.6.5-.7 1.3-1.1 2-1.1s1.5.4 2 1.1c.7 1 .9 2.3 1.2 3.6.2 1 .3 2.2 1.2 2.2.6 0 .8-.7 1-1.3.6-1.7 1-3.8 1.7-5.4.7-1.6 1.3-3 1.6-4.9.4-2.5-.5-5-2.4-5.9-2.3-1-4.6-.4-6.2 1Z" fill="currentColor" />
    </svg>
  )
}

export default function SchedulePage() {
  const params = useSearchParams()
  const practice = params.get("p") ?? ""
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([])
  const [tenant, setTenant] = useState<{ id: string; name: string; services: string[] } | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", service: "", date: "", time: "" })
  const [done, setDone] = useState<{ reference: string; date: string; time: string } | null>(null)
  const [err, setErr] = useState("")

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((d) => {
        setTenants(d.tenants ?? [])
        const id = practice || (d.tenants && d.tenants.length > 0 ? d.tenants[0].id : "")
        if (id) fetchTenant(id)
      })
  }, [practice])

  const fetchTenant = (id: string) => {
    fetch("/api/tenants/" + id).then((r) => r.json()).then((t) => setTenant(t)).catch(() => undefined)
  }

  const submit = async () => {
    setErr("")
    if (!form.name || !form.date || !form.time) { setErr("Nom, date et heure sont requis."); return }
    const r = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ practice: tenant?.id, ...form }),
    })
    const d = await r.json()
    if (r.ok && d.created) {
      setDone({ reference: d.reference, date: d.date, time: d.time })
    } else {
      setErr(d.error ?? "Erreur lors de la réservation.")
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ToothMark className="size-5" /></div>
          <CardTitle className="font-heading">{tenant?.name ?? "Prise de rendez-vous"}</CardTitle>
          <CardDescription>Réservez en ligne — confirmé immédiatement</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CalendarCheck className="size-8 text-emerald-500" />
              <p className="font-heading text-lg font-semibold">Rendez-vous confirmé</p>
              <p className="text-sm text-muted-foreground">{done.date} à {done.time} — référence {done.reference}.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {tenants.length > 1 ? (
                <div className="flex flex-col gap-2">
                  <Label>Cabinet</Label>
                  <Select value={tenant?.id} onValueChange={(v) => fetchTenant(v ?? "")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2"><Label>Nom complet</Label><Input value={form.name} onChange={(e) => setForm((x) => ({ ...x, name: e.target.value }))} /></div>
                <div className="flex flex-col gap-2"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm((x) => ({ ...x, phone: e.target.value }))} /></div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Motif</Label>
                <Select value={form.service} onValueChange={(v) => setForm((x) => ({ ...x, service: v ?? "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(tenant?.services ?? []).map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    <SelectItem value="Consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((x) => ({ ...x, date: e.target.value }))} /></div>
                <div className="flex flex-col gap-2"><Label>Heure</Label><Input type="time" value={form.time} onChange={(e) => setForm((x) => ({ ...x, time: e.target.value }))} /></div>
              </div>
              {err ? <p className="text-sm text-red-500">{err}</p> : null}
              <Button onClick={submit}>Réserver</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
