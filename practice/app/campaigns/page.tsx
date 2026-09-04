"use client"

import { useState } from "react"
import { BellRing, PhoneCall, Repeat, UserPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"
import type { ActivityEvent } from "@/lib/types"

const REMINDER_STEPS = [
  { when: "J-7", action: "Appel du patient pour confirmer", detail: "Si pas de réponse → SMS de confirmation" },
  { when: "J-1", action: "Nouvel appel", detail: "Si pas de réponse → SMS de rappel" },
]
const REACTIVATION_STEPS = [
  { when: "Jour 0", action: "Appel pour réactiver / replanifier", detail: "Proposer un rendez-vous de contrôle" },
  { when: "Jour +3", action: "Rappel téléphonique", detail: "Si pas de réponse" },
  { when: "Jour +6", action: "SMS de relance", detail: "Si toujours pas de réponse" },
]

export default function CampaignsPage() {
  const { tenant } = usePractice()
  const data = usePracticeData()
  const [reminder, setReminder] = useState(true)
  const [reactivation, setReactivation] = useState(false)

  const bookings = data.bookings as ActivityEvent[]
  const today = new Date().toISOString().slice(0, 10)
  const dueReminders = bookings.filter((b) => {
    const d = String(b.date)
    if (d < today) return false
    const diff = Math.floor((new Date(d + "T00:00:00").getTime() - Date.now()) / 86400000)
    return diff <= 7
  })

  const lapsed = data.demo
    ? [
        { name: "Marie Lefebvre", last: "il y a 14 mois", service: "Contrôle annuel" },
        { name: "Paul Girard", last: "il y a 18 mois", service: "Détartrage" },
        { name: "Isabelle Roux", last: "il y a 13 mois", service: "Contrôle" },
      ]
    : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Campagnes</h1>
        <p className="text-sm text-muted-foreground">Relances automatiques par téléphone et SMS pour réduire les absences et réactiver les patients</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <BellRing className="size-4 text-primary" />
            <div>
              <CardTitle className="text-base">Rappels de rendez-vous</CardTitle>
              <CardDescription>Confirmez chaque rendez-vous à J-7 et J-1 — réduction des absences</CardDescription>
            </div>
          </div>
          <Switch checked={reminder} onCheckedChange={setReminder} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="flex flex-col gap-2">
            {REMINDER_STEPS.map((s) => (
              <li key={s.when} className="flex gap-3 rounded-xl border p-3">
                <span className="font-heading text-sm font-semibold text-primary">{s.when}</span>
                <div>
                  <p className="text-sm font-medium">{s.action}</p>
                  <p className="text-xs text-muted-foreground">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          {dueReminders.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium">À rappeler dans les 7 prochains jours ({dueReminders.length})</p>
              <div className="flex flex-col gap-1.5">
                {dueReminders.slice(0, 5).map((b) => (
                  <div key={String(b.reference)} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                    <span className="font-medium">{String(b.customer_name)}</span>
                    <span className="text-xs text-muted-foreground">{String(b.service)} · {String(b.date)} {String(b.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun rendez-vous dans les 7 prochains jours.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Repeat className="size-4 text-primary" />
            <div>
              <CardTitle className="text-base">Réactivation des patients inactifs</CardTitle>
              <CardDescription>Recontactez les patients qui ne sont pas revenus depuis plus de 12 mois</CardDescription>
            </div>
          </div>
          <Switch checked={reactivation} onCheckedChange={setReactivation} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="flex flex-col gap-2">
            {REACTIVATION_STEPS.map((s) => (
              <li key={s.when} className="flex gap-3 rounded-xl border p-3">
                <span className="font-heading text-sm font-semibold text-primary">{s.when}</span>
                <div>
                  <p className="text-sm font-medium">{s.action}</p>
                  <p className="text-xs text-muted-foreground">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          {lapsed.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium">Patients à réactiver ({lapsed.length})</p>
              <div className="flex flex-col gap-1.5">
                {lapsed.map((p) => (
                  <div key={p.name} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.service} · dernière visite {p.last}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun patient inactif détecté (en production, ceci provient de votre logiciel de gestion).</p>
          )}
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            L&apos;envoi réel des appels et SMS nécessite la ligne téléphonique (Twilio/Telnyx) — feuille de route. Ces séquences définissent exactement le comportement une fois connectée.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
