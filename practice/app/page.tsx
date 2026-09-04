"use client"

import { useCallback } from "react"
import Link from "next/link"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowRight, CalendarCheck, Euro, FlaskConical, PhoneCall, RefreshCw, Sparkles, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"
import type { ActivityEvent } from "@/lib/types"

const fmtEUR = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)
const fmtNum = (n: number) => new Intl.NumberFormat("fr-FR").format(n)
const fmtDT = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

function Kpi({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <span className="text-primary/70">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="font-heading text-[1.7rem] font-semibold leading-none tracking-tight">{value}</div>
        {sub ? <p className="mt-2 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

export default function OverviewPage() {
  const { tenant, agentUp, refresh } = usePractice()
  const data = usePracticeData()
  const { demoEnabled: demo, setDemoEnabled } = usePractice()
  const bookings = data.bookings as ActivityEvent[]
  const calls = data.calls ?? []
  const avgValue = tenant?.avg_appointment_value ?? 0
  const revenue = bookings.length * avgValue
  const missed = tenant?.missed_calls_per_month ?? 0
  const conversion = calls.length + bookings.length > 0 ? Math.round((bookings.length / (calls.length + bookings.length)) * 100) : 0

  const series = useCallback(() => {
    const days: { day: string; rdv: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      days.push({ day: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), rdv: 0 })
    }
    for (const b of bookings) {
      const date = String(b.date ?? "")
      if (!date) continue
      const label = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
      const idx = days.findIndex((x) => x.day === label)
      if (idx >= 0) days[idx].rdv++
    }
    return days
  }, [bookings])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Vue d&apos;ensemble</h1>
          <p className="text-sm text-muted-foreground">
            {tenant ? tenant.name : "Chargement…"} · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={demo ? "default" : "outline"}
            size="sm"
            onClick={() => setDemoEnabled(!demo)}
            className={demo ? "gap-1.5" : "gap-1.5 text-muted-foreground"}
          >
            <Sparkles className="size-3.5" /> {demo ? "Mode démo actif" : "Mode démo"}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="size-3.5" /> Actualiser</Button>
        </div>
      </div>

      {data.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <>
          {data.isEmpty && !demo ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FlaskConical className="size-5" /></div>
                  <div>
                    <p className="font-heading text-sm font-semibold">Aucun appel réel pour le moment</p>
                    <p className="text-sm text-muted-foreground">Explorez le produit avec des données de démonstration — ou connectez votre ligne téléphonique.</p>
                  </div>
                </div>
                <Button onClick={() => setDemoEnabled(true)}>Activer la démo <ArrowRight className="size-4" /></Button>
              </CardContent>
            </Card>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Rendez-vous réservés" value={fmtNum(bookings.length)} sub={demo ? "données de démonstration" : "par l&apos;agent au téléphone"} icon={<CalendarCheck className="size-4" />} />
            <Kpi label="Production estimée" value={fmtEUR(revenue)} sub={avgValue > 0 ? "valeur moyenne d&apos;un RDV : " + fmtEUR(avgValue) : "définissez la valeur d&apos;un RDV dans Réglages"} icon={<Euro className="size-4" />} />
            <Kpi label="Appels gérés" value={fmtNum(calls.length)} sub={agentUp ? "agent en ligne 24/7" : "agent hors ligne"} icon={<PhoneCall className="size-4" />} />
            <Kpi label="Conversion" value={conversion + " %"} sub="appels devenus rendez-vous" icon={<TrendingUp className="size-4" />} />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Rendez-vous sur 14 jours</CardTitle>
                <CardDescription>Réservés par l&apos;agent — chaque RDV vaut en moyenne {avgValue > 0 ? fmtEUR(avgValue) : "—"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series()} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                      <defs>
                        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }} />
                      <Area type="monotone" dataKey="rdv" stroke="var(--primary)" strokeWidth={2} fill="url(#fill)" name="Rendez-vous" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appels qui ne restent plus sans réponse</CardTitle>
                <CardDescription>Le coût d&apos;opportunité d&apos;un téléphone non décroché</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-xs text-muted-foreground">Avant l&apos;agent (estimation)</p>
                  <p className="font-heading text-2xl font-semibold">{missed > 0 ? "~" + fmtNum(missed) + " appels / mois" : "non renseigné"}</p>
                  {missed > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Soit environ {fmtEUR(missed * 0.25 * avgValue)} de production potentielle par mois (25 % de conversion estimée)
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground">Avec l&apos;agent, cette période</p>
                  <p className="font-heading text-2xl font-semibold text-primary">{fmtNum(calls.length)} appels gérés</p>
                  <p className="mt-1 text-xs text-muted-foreground">{fmtNum(bookings.length)} ont abouti à un rendez-vous</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Derniers appels</CardTitle>
                <CardDescription>Transcriptions et résumés après chaque appel</CardDescription>
              </div>
              <Link href="/calls" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Tout voir <ArrowRight className="size-3.5" /></Link>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y">
                {calls.slice(0, 4).map((call) => (
                  <Link key={call.id} href="/calls" className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><PhoneCall className="size-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{call.summary || "Appel sans résumé"}</p>
                      <p className="text-xs text-muted-foreground">{fmtDT(call.id.replace("demo-", "").replace(/_/g, " ").replace(/-/g, "/"))}</p>
                    </div>
                    {call.has_audio ? <Badge variant="outline">Audio</Badge> : null}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
