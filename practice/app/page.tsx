"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowRight, CalendarCheck, Euro, PhoneCall, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
import type { Activity, ActivityEvent } from "@/lib/types"

const fmtEUR = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)
const fmtNum = (n: number) => new Intl.NumberFormat("fr-FR").format(n)
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </CardHeader>
      <CardContent>
        <div className="font-heading text-2xl font-semibold tracking-tight">{value}</div>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

export default function OverviewPage() {
  const { tenant, tenantId, agentUp, refreshTick, refresh } = usePractice()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [calls, setCalls] = useState<{ id: string; summary: string; message_count: number; has_audio: boolean }[] | null>(null)

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      fetch("/api/tenants/" + tenantId + "/activity").then((r) => r.json()).catch(() => null),
      fetch("/api/tenants/" + tenantId + "/calls").then((r) => r.json()).catch(() => null),
    ]).then(([a, c]) => {
      if (a) setActivity(a)
      if (c) setCalls(c.calls ?? [])
    })
  }, [tenantId, refreshTick])

  const bookings = activity?.bookings ?? []
  const avgValue = tenant?.avg_appointment_value ?? 0
  const revenue = bookings.length * avgValue
  const callCount = calls?.length ?? 0
  const conversion = callCount + bookings.length > 0 ? Math.round((bookings.length / (callCount + bookings.length)) * 100) : 0

  const series = useCallback(() => {
    const days: { day: string; rdv: number }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      days.push({ day: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), rdv: 0 })
    }
    for (const b of bookings as ActivityEvent[]) {
      const date = String(b.date ?? "")
      if (!date) continue
      const label = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
      const idx = days.findIndex((x) => x.day === label)
      if (idx >= 0) days[idx].rdv++
    }
    return days
  }, [bookings])

  const loading = !activity || !tenant

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Vue d&apos;ensemble</h1>
          <p className="text-sm text-muted-foreground">
            {tenant ? tenant.name : "Chargement…"} — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="size-3.5" /> Actualiser</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Rendez-vous réservés" value={fmtNum(bookings.length)} sub={"par l'agent au téléphone"} icon={<CalendarCheck className="size-4" />} />
            <StatCard label="Revenu estimé" value={fmtEUR(revenue)} sub={avgValue > 0 ? "valeur moyenne d'un RDV : " + fmtEUR(avgValue) : "configurez la valeur moyenne d'un RDV dans Réglages"} icon={<Euro className="size-4" />} />
            <StatCard label="Appels gérés" value={fmtNum(callCount)} sub={agentUp ? "agent en ligne 24/7" : "agent hors ligne"} icon={<PhoneCall className="size-4" />} />
            <StatCard label="Conversion" value={conversion + " %"} sub="appels qui deviennent rendez-vous" />
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rendez-vous sur 14 jours</CardTitle>
              <CardDescription>Chaque rendez-vous réservé par l'agent vaut en moyenne {avgValue > 0 ? fmtEUR(avgValue) : "—"}</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Aucun rendez-vous pour le moment</p>
                  <p>Passez un appel à l'agent — les rendez-vous apparaîtront ici avec leur valeur.</p>
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series()} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                      <defs>
                        <linearGradient id="rdvFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }} />
                      <Area type="monotone" dataKey="rdv" stroke="var(--primary)" strokeWidth={2} fill="url(#rdvFill)" name="Rendez-vous" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Derniers appels</CardTitle>
                <CardDescription>Transcriptions et résumés générés après chaque appel</CardDescription>
              </div>
              <Link href="/calls" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Tout voir <ArrowRight className="size-3.5" /></Link>
            </CardHeader>
            <CardContent>
              {calls && calls.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Aucun appel enregistré</p>
                  <p>Les appels apparaîtront ici avec leur résumé et leur audio.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {(calls ?? []).slice(0, 3).map((call) => (
                    <Link key={call.id} href="/calls" className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/50">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><PhoneCall className="size-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{call.summary || "Appel sans résumé"}</p>
                        <p className="text-xs text-muted-foreground">{fmtDateTime(call.id.replace(/_/g, " ").replace(/-/g, "/"))}</p>
                      </div>
                      {call.has_audio ? <Badge variant="outline">Audio</Badge> : null}
                      {call.message_count > 0 ? <Badge variant="secondary">{call.message_count} msg</Badge> : null}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
