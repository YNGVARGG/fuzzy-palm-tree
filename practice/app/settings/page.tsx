"use client"

import { useEffect, useState } from "react"
import { Download, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { usePractice } from "@/components/practice-context"

export default function SettingsPage() {
  const { tenant, tenantId, refresh } = usePractice()
  const [f, setF] = useState({
    name: "", tagline: "", greeting_name: "", language: "fr", hours: "",
    after_hours_note: "", booking_slots: "", callback_promise: "",
    services: "", faq: "", avg_appointment_value: "", missed_calls_per_month: "",
  })
  const [msg, setMsg] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [newF, setNewF] = useState({ name: "", tagline: "", hours: "", language: "fr" })
  const [newMsg, setNewMsg] = useState("")

  useEffect(() => {
    if (!tenant) return
    setF({
      name: tenant.name ?? "",
      tagline: tenant.tagline ?? "",
      greeting_name: tenant.greeting_name ?? "Sophie",
      language: tenant.language ?? "fr",
      hours: tenant.hours ?? "",
      after_hours_note: tenant.after_hours_note ?? "",
      booking_slots: tenant.booking_slots ?? "",
      callback_promise: tenant.callback_promise ?? "",
      services: (tenant.services ?? []).join("\n"),
      faq: Object.entries(tenant.faq ?? {}).map(([k, v]) => k + ": " + v).join("\n"),
      avg_appointment_value: String(tenant.avg_appointment_value ?? ""),
      missed_calls_per_month: String(tenant.missed_calls_per_month ?? ""),
    })
  }, [tenant])

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }))

  const save = async () => {
    const faq: Record<string, string> = {}
    for (const line of f.faq.split("\n")) {
      const i = line.indexOf(":")
      if (i > 0) {
        const k = line.slice(0, i).trim()
        const v = line.slice(i + 1).trim()
        if (k && v) faq[k] = v
      }
    }
    const body: Record<string, unknown> = {
      name: f.name, tagline: f.tagline, greeting_name: f.greeting_name, language: f.language,
      hours: f.hours, after_hours_note: f.after_hours_note, booking_slots: f.booking_slots,
      callback_promise: f.callback_promise,
      services: f.services.split("\n").map((s) => s.trim()).filter(Boolean),
      faq,
    }
    const avg = parseFloat(f.avg_appointment_value)
    if (isFinite(avg)) body.avg_appointment_value = avg
    const missed = parseInt(f.missed_calls_per_month, 10)
    if (isFinite(missed)) body.missed_calls_per_month = missed
    const r = await fetch("/api/tenants/" + tenantId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (r.ok) {
      setMsg("Enregistré — l'agent appliquera ces informations dès le prochain appel.")
      setTimeout(() => setMsg(""), 5000)
      refresh()
    } else {
      setMsg("Erreur lors de l'enregistrement.")
    }
  }

  const createPractice = async () => {
    if (!newF.name.trim()) return
    const r = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newF.name.trim(), tagline: newF.tagline.trim(), hours: newF.hours.trim(), language: newF.language }),
    })
    const d = await r.json()
    if (r.ok && d.id) {
      setNewMsg("Cabinet créé : " + d.name)
      setShowNew(false)
      setNewF({ name: "", tagline: "", hours: "", language: "fr" })
      window.location.reload()
    } else {
      setNewMsg("Erreur : " + (d.error ?? "inconnue"))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Réglages</h1>
          <p className="text-sm text-muted-foreground">Ce que l&apos;agent sait de votre cabinet — appliqué dès le prochain appel</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowNew((v) => !v)}>Nouveau cabinet</Button>
      </div>

      {showNew ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Créer un cabinet</CardTitle><CardDescription>Un nouvel agent prêt en une minute</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Nom</Label>
                <Input value={newF.name} onChange={(e) => setNewF((x) => ({ ...x, name: e.target.value }))} placeholder="Ex : Cabinet Dentaire Rive Gauche" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Slogan</Label>
                <Input value={newF.tagline} onChange={(e) => setNewF((x) => ({ ...x, tagline: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Horaires</Label>
              <Input value={newF.hours} onChange={(e) => setNewF((x) => ({ ...x, hours: e.target.value }))} placeholder="Ex : du lundi au vendredi de 8h30 à 19h" />
            </div>
            <div className="flex items-center gap-4">
              <Label>Langue</Label>
              <Select value={newF.language} onValueChange={(v) => setNewF((x) => ({ ...x, language: v ?? "fr" }))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createPractice}>Créer</Button>
              {newMsg ? <p className="text-sm text-muted-foreground">{newMsg}</p> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil du cabinet</CardTitle>
          <CardDescription>Nom, horaires, services — les faits que l&apos;agent cite aux patients</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Nom du cabinet</Label>
              <Input value={f.name} onChange={set("name")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Slogan</Label>
              <Input value={f.tagline} onChange={set("tagline")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label>Prénom de l&apos;agent</Label>
              <Input value={f.greeting_name} onChange={set("greeting_name")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Langue</Label>
              <Select value={f.language} onValueChange={(v) => setF((x) => ({ ...x, language: v ?? "fr" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Valeur moyenne d&apos;un rendez-vous (€)</Label>
              <Input type="number" value={f.avg_appointment_value} onChange={set("avg_appointment_value")} placeholder="75" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Horaires</Label>
            <Input value={f.hours} onChange={set("hours")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Services (un par ligne)</Label>
            <Textarea rows={4} value={f.services} onChange={set("services")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Questions fréquentes (format : « question : réponse » par ligne)</Label>
            <Textarea rows={10} value={f.faq} onChange={set("faq")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Consigne après les heures d&apos;ouverture</Label>
              <Textarea rows={2} value={f.after_hours_note} onChange={set("after_hours_note")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Promesse de rappel</Label>
              <Input value={f.callback_promise} onChange={set("callback_promise")} />
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-4">
            <Button onClick={save}><Save className="size-4" /> Enregistrer</Button>
            {msg ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Données &amp; conformité RGPD</CardTitle>
          <CardDescription>Vos appels contiennent des données de santé — la conformité est intégrée</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ul className="list-inside list-disc space-y-1.5 text-muted-foreground">
            <li>L&apos;agent annonce l&apos;enregistrement au début de chaque appel (consentement, art. L.226-1 Code pénal / RGPD).</li>
            <li>Transcriptions et enregistrements peuvent contenir des données de santé (art. 9 RGPD) — accès limité à votre équipe.</li>
            <li>Effacement : supprimez un appel depuis la page Appels (bouton corbeille) — droit à l&apos;effacement.</li>
            <li>Portabilité : exportez toutes les données du cabinet ci-dessous.</li>
            <li>Conservation : définissez votre durée de rétention (recommandé : 12 mois pour un cabinet) et purgez ensuite.</li>
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <a href={"/api/tenants/" + tenantId + "/export"} download>
              <Button variant="outline" size="sm"><Download className="size-3.5" /> Exporter toutes mes données (JSON)</Button>
            </a>
            <span className="text-xs text-muted-foreground">Voir docs/rgpd-product.md pour le registre et les bonnes pratiques.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}