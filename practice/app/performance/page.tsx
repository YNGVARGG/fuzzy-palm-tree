"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"

const fmtEUR = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const REASON: Record<string, string> = {
  rdv: "A réservé",
  question: "Simple question",
  message: "A laissé un message",
  raccrochage: "A raccroché",
  urgence: "Urgence (escaladée)",
  escalation: "Cas complexe (escaladé)",
  inconnu: "Autre",
}

export default function PerformancePage() {
  const { tenant } = usePractice()
  const data = usePracticeData()
  const bookings = data.bookings.length
  const calls = data.calls.length
  const avg = tenant?.avg_appointment_value ?? 0
  const revenue = bookings * avg
  const conversion = calls + bookings > 0 ? Math.round((bookings / (calls + bookings)) * 100) : 0
  const escalations = data.messages.filter((m) => m.kind === "escalation").length

  const reasons: Record<string, number> = {}
  for (const c of data.calls) {
    const t = c.type || "inconnu"
    if (t !== "rdv") reasons[t] = (reasons[t] ?? 0) + 1
  }
  const nonBook = Object.entries(reasons).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Performances</h1>
        <p className="text-sm text-muted-foreground">Conversion, revenu et raisons de non-réservation — la transparence totale de l&apos;agent</p>
      </div>

      {data.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardDescription>Appels reçus</CardDescription></CardHeader><CardContent><div className="font-heading text-2xl font-semibold">{calls}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Rendez-vous réservés</CardDescription></CardHeader><CardContent><div className="font-heading text-2xl font-semibold">{bookings}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Taux de conversion</CardDescription></CardHeader><CardContent><div className="font-heading text-2xl font-semibold text-primary">{conversion} %</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Revenu estimé</CardDescription></CardHeader><CardContent><div className="font-heading text-2xl font-semibold">{fmtEUR(revenue)}</div></CardContent></Card>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pourquoi les patients ne réservent pas</CardTitle>
                <CardDescription>Répartition des appels sans rendez-vous — identifiez les objections récurrentes</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {nonBook.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun appel sans rendez-vous pour le moment.</p>
                ) : (
                  nonBook.map(([t, n]) => {
                    const pct = calls > 0 ? Math.round((n / calls) * 100) : 0
                    return (
                      <div key={t} className="flex items-center gap-3">
                        <span className="w-44 shrink-0 text-sm">{REASON[t] ?? t}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: Math.max(4, pct) + "%" }} />
                        </div>
                        <span className="w-10 text-right text-sm text-muted-foreground">{n}</span>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tâches pour votre équipe</CardTitle>
                <CardDescription>Escalades et demandes de rappel — tout ce qui attend un humain</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {data.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune tâche en attente.</p>
                ) : (
                  data.messages.map((m) => (
                    <div key={String(m.message_id) + String(m.at)} className="flex items-start gap-2 rounded-xl border p-3">
                      <Badge className={m.kind === "escalation" ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" : ""}>{m.kind === "escalation" ? "Escalade" : "Message"}</Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{String(m.customer_name)}</p>
                        <p className="text-xs text-muted-foreground">{String(m.message)}</p>
                      </div>
                    </div>
                  ))
                )}
                {escalations > 0 ? <p className="text-xs text-muted-foreground">Dont {escalations} escalade(s) (avis médical, urgence, cas complexe).</p> : null}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
