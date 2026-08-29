"use client"

import { useCallback, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { RiCustomerService2Line, RiMoonLine, RiSunLine, RiRefreshLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Activity, Tenant, TenantSummary } from "@/lib/types"

const fmtDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function StatusPill({ up }: { up: boolean | null }) {
  if (up === null) return <Badge variant="outline">Vérification…</Badge>
  return up
    ? <Badge className="gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />Agent en ligne</Badge>
    : <Badge variant="destructive" className="gap-1.5"><span className="size-1.5 rounded-full bg-current" />Agent hors ligne</Badge>
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

export default function Dashboard() {
  const { resolvedTheme, setTheme } = useTheme()
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [tenantId, setTenantId] = useState<string>("")
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [agentUp, setAgentUp] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (id: string) => {
    if (!id) return
    const [act, st] = await Promise.all([
      fetch("/api/tenants/" + id + "/activity").then((r) => r.json()).catch(() => null),
      fetch("/api/tenants/" + id + "/status").then((r) => r.json()).catch(() => null),
    ])
    if (act) setActivity(act)
    if (st) setAgentUp(Boolean(st.up))
  }, [])

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((d) => {
        setTenants(d.tenants ?? [])
        if (d.tenants && d.tenants.length > 0) setTenantId(d.tenants[0].id)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!tenantId) return
    fetch("/api/tenants/" + tenantId)
      .then((r) => r.json())
      .then(setTenant)
      .catch(() => undefined)
    refresh(tenantId)
  }, [tenantId, refresh])

  useEffect(() => {
    if (!tenantId) return
    const t = setInterval(() => refresh(tenantId), 15000)
    return () => clearInterval(t)
  }, [tenantId, refresh])

  // ---- Configuration form state ----
  const [form, setForm] = useState({
    name: "", tagline: "", greeting_name: "", language: "fr", hours: "",
    after_hours_note: "", booking_slots: "", callback_promise: "", services: "", faq: "",
  })
  const [savedMsg, setSavedMsg] = useState("")

  useEffect(() => {
    if (!tenant) return
    setForm({
      name: tenant.name ?? "",
      tagline: tenant.tagline ?? "",
      greeting_name: tenant.greeting_name ?? "Alex",
      language: tenant.language ?? "fr",
      hours: tenant.hours ?? "",
      after_hours_note: tenant.after_hours_note ?? "",
      booking_slots: tenant.booking_slots ?? "",
      callback_promise: tenant.callback_promise ?? "",
      services: (tenant.services ?? []).join("\n"),
      faq: Object.entries(tenant.faq ?? {}).map(([k, v]) => k + ": " + v).join("\n"),
    })
  }, [tenant])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = async () => {
    const faq: Record<string, string> = {}
    for (const line of form.faq.split("\n")) {
      const i = line.indexOf(":")
      if (i > 0) {
        const k = line.slice(0, i).trim()
        const v = line.slice(i + 1).trim()
        if (k && v) faq[k] = v
      }
    }
    const res = await fetch("/api/tenants/" + tenantId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        services: form.services.split("\n").map((s) => s.trim()).filter(Boolean),
        faq,
      }),
    })
    if (res.ok) {
      setSavedMsg("Configuration enregistrée — l'agent l'appliquera dès le prochain appel.")
      setTimeout(() => setSavedMsg(""), 5000)
      const updated = await res.json()
      if (updated.tenant) setTenant(updated.tenant)
    } else {
      setSavedMsg("Erreur lors de l'enregistrement.")
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const lastEvent = activity && activity.total_events > 0
    ? activity.bookings[0] ?? activity.messages[0]
    : null

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-6 pb-16">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <RiCustomerService2Line className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Standard IA</h1>
            <p className="text-xs text-muted-foreground">La régie de votre agent téléphonique</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill up={agentUp} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Basculer le thème"
          >
            {resolvedTheme === "dark" ? <RiSunLine className="size-4" /> : <RiMoonLine className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Tenant selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Label htmlFor="tenant" className="text-muted-foreground">Entreprise</Label>
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger id="tenant" className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tenant ? (
            <Badge variant="outline">{tenant.language === "fr" ? "Français" : "English"}</Badge>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh(tenantId)}>
          <RiRefreshLine className="size-4" /> Actualiser
        </Button>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Rendez-vous pris" value={activity ? activity.bookings.length : "—"} />
        <StatCard label="Messages reçus" value={activity ? activity.messages.length : "—"} />
        <StatCard label="Actions totales" value={activity ? activity.total_events : "—"} />
        <StatCard
          label="Dernière action"
          value={lastEvent ? fmtDate(String(lastEvent.at)) : "—"}
          hint={lastEvent ? String(lastEvent.kind === 'appointment_booked' ? 'Rendez-vous' : 'Message') : "Aucune activité pour l'instant"}
        />
      </section>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* ---- Activité ---- */}
        <TabsContent value="activity" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rendez-vous</CardTitle>
              <CardDescription>Les réservations prises par votre agent au téléphone</CardDescription>
            </CardHeader>
            <CardContent>
              {activity && activity.bookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Heure</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead className="text-right">Pris le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.bookings.map((b) => (
                      <TableRow key={String(b.reference)}>
                        <TableCell className="font-mono text-xs">{String(b.reference)}</TableCell>
                        <TableCell>{String(b.date)}</TableCell>
                        <TableCell>{String(b.time)}</TableCell>
                        <TableCell>{String(b.service)}</TableCell>
                        <TableCell>{String(b.customer_name)}</TableCell>
                        <TableCell className="font-mono text-xs">{String(b.phone)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{fmtDate(String(b.at))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState>
                  <p className="font-medium text-foreground">Aucun rendez-vous pour le moment</p>
                  <p>Passez un appel à votre agent — les réservations apparaîtront ici.</p>
                </EmptyState>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages</CardTitle>
              <CardDescription>Les demandes de rappel et messages laissés par les appelants</CardDescription>
            </CardHeader>
            <CardContent>
              {activity && activity.messages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-right">Reçu le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.messages.map((m) => (
                      <TableRow key={String(m.message_id)}>
                        <TableCell>{String(m.customer_name)}</TableCell>
                        <TableCell className="font-mono text-xs">{String(m.phone)}</TableCell>
                        <TableCell className="max-w-md truncate">{String(m.message)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{fmtDate(String(m.at))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState>
                  <p className="font-medium text-foreground">Aucun message</p>
                  <p>Les demandes de rappel seront listées ici.</p>
                </EmptyState>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Configuration ---- */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profil de l'entreprise</CardTitle>
              <CardDescription>Ce que votre agent sait de votre entreprise — appliqué dès le prochain appel</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="f-name">Nom de l'entreprise</Label>
                  <Input id="f-name" value={form.name} onChange={set("name")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="f-tagline">Slogan</Label>
                  <Input id="f-tagline" value={form.tagline} onChange={set("tagline")} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="f-greeting">Prénom de l'agent</Label>
                  <Input id="f-greeting" value={form.greeting_name} onChange={set("greeting_name")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="f-lang">Langue</Label>
                  <Select value={form.language} onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}>
                    <SelectTrigger id="f-lang"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="f-hours">Horaires</Label>
                <Input id="f-hours" value={form.hours} onChange={set("hours")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="f-services">Services (un par ligne)</Label>
                <Textarea id="f-services" rows={4} value={form.services} onChange={set("services")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="f-faq">Questions fréquentes (format : « question : réponse » par ligne)</Label>
                <Textarea id="f-faq" rows={8} value={form.faq} onChange={set("faq")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="f-note">Consigne après les heures d'ouverture</Label>
                <Textarea id="f-note" rows={2} value={form.after_hours_note} onChange={set("after_hours_note")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="f-slots">Créneaux</Label>
                  <Input id="f-slots" value={form.booking_slots} onChange={set("booking_slots")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="f-callback">Promesse de rappel</Label>
                  <Input id="f-callback" value={form.callback_promise} onChange={set("callback_promise")} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <Button onClick={save}>Enregistrer</Button>
                {savedMsg ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{savedMsg}</p> : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="text-center text-xs text-muted-foreground">
        Standard IA — chaque entreprise a son agent. Données locales, aucune fuite vers le cloud.
      </footer>
    </div>
  )
}
