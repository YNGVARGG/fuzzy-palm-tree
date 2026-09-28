"use client"


import Link from "next/link"
import { ArrowRight, CalendarCheck, CircleAlert, FlaskConical, PhoneCall, RefreshCw, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"
import { formatDateTime } from "@/components/operational-data"
import type { ActivityEvent, PracticeSummary } from "@/lib/types"

const fmtNum = (value: number) => new Intl.NumberFormat("fr-FR").format(value)

function Kpi({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return <Card size="sm" className="compact-card"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardDescription>{label}</CardDescription><span className="text-primary/70">{icon}</span></CardHeader><CardContent><div className="font-heading text-[1.55rem] font-semibold leading-none tracking-tight">{value}</div>{sub ? <p className="mt-2 text-xs text-muted-foreground">{sub}</p> : null}</CardContent></Card>
}

function PendingWork({ tasks }: { tasks: ActivityEvent[] }) {
  return <Card className="compact-card" size="sm"><CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0"><div><div className="flex items-center gap-2"><CircleAlert className="size-4 text-primary" /><CardTitle className="text-base">À traiter en priorité</CardTitle></div><CardDescription className="mt-1">Les demandes qui attendent une action de l’équipe.</CardDescription></div><Link href="/inbox" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">Tout voir <ArrowRight className="size-3.5" /></Link></CardHeader><CardContent className="flex flex-col divide-y">{tasks.length === 0 ? <p className="text-sm text-muted-foreground">Aucune demande ouverte.</p> : tasks.slice(0, 6).map((task) => <Link key={String(task.id ?? task.at)} href="/inbox" className="py-4 transition-colors hover:bg-muted/40"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{String(task.customer_name ?? "Patient inconnu")}</p>{task.priority === "urgent" ? <Badge variant="outline" className="shrink-0 border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400">Urgent</Badge> : null}</div><p className="mt-1 truncate text-xs text-muted-foreground">{String(task.message ?? "Demande à qualifier")}</p><p className="mt-2 text-[11px] text-muted-foreground">{task.due_at ? `Échéance ${formatDateTime(task.due_at)}` : "À attribuer"}</p></Link>)}</CardContent></Card>
}

export default function OverviewPage() {
  const { agentUp, refresh, demoEnabled, setDemoEnabled } = usePractice()
  const data = usePracticeData()
  const summary = data.summary as PracticeSummary | null
  const bookings = summary?.bookings ?? data.bookings.length
  const calls = summary?.calls ?? data.calls.length
  const openTasks = summary?.openTasks ?? data.messages.filter((item) => item.status !== "resolved").length
  const pendingTasks = summary?.pendingTasks ?? data.messages.filter((item) => item.status !== "resolved").slice(0, 6)

  return <div className="flex flex-col gap-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-3xl font-semibold tracking-tight">Aujourd’hui</h1><p className="mt-2 text-sm text-muted-foreground">Les demandes de votre cabinet, au premier plan.</p></div><div className="flex flex-wrap items-end gap-2"><Button variant={demoEnabled ? "default" : "outline"} size="sm" onClick={() => setDemoEnabled(!demoEnabled)} className="gap-1.5"><Sparkles className="size-3.5" /> {demoEnabled ? "Mode démo actif" : "Mode démo"}</Button><Button variant="outline" size="sm" onClick={refresh} className="gap-1.5"><RefreshCw className="size-3.5" /> Actualiser</Button></div></header>

    {data.error ? <Card className="compact-card border-destructive/30 bg-destructive/5"><CardContent className="py-3 text-sm">{data.error}</CardContent></Card> : null}

    {data.loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24" />)}</div> : <>
      {data.isEmpty && !demoEnabled ? <Card className="compact-card border-primary/30 bg-primary/5"><CardContent className="flex flex-wrap items-center justify-between gap-4 py-4"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FlaskConical className="size-4" /></div><div><p className="font-heading text-sm font-semibold">Le tableau de bord est prêt</p><p className="text-sm text-muted-foreground">Les appels et rendez-vous apparaîtront dès la première conversation.</p></div></div><Button onClick={() => setDemoEnabled(true)}>Explorer la démo <ArrowRight className="size-4" /></Button></CardContent></Card> : null}

      <section aria-label="Activité du cabinet" className="grid gap-4 sm:grid-cols-3"><Kpi label="Demandes ouvertes" value={fmtNum(openTasks)} sub="Toutes périodes confondues" icon={<CircleAlert className="size-4" />} /><Kpi label="Appels sur la période" value={fmtNum(calls)} sub={agentUp === null ? "Connexion en cours de vérification" : agentUp ? "Serveur vocal connecté" : "Serveur vocal déconnecté"} icon={<PhoneCall className="size-4" />} /><Kpi label="Rendez-vous enregistrés" value={fmtNum(bookings)} sub={demoEnabled ? "Données de démonstration" : "Sur la période du tableau de bord"} icon={<CalendarCheck className="size-4" />} /></section>
      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_1fr]">
      <PendingWork tasks={pendingTasks} />
      <Card className="compact-card"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Derniers appels</CardTitle><CardDescription>Résumé disponible après chaque appel</CardDescription></div><Link href="/calls" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">Tout voir <ArrowRight className="size-3.5" /></Link></CardHeader><CardContent><div className="flex flex-col divide-y">{(summary?.recentCalls ?? data.calls.slice(0, 5)).map((call) => <Link key={call.id} href={`/calls/${encodeURIComponent(call.id)}`} className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/50"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><PhoneCall className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm">{call.summary || "Appel sans résumé"}</p><p className="text-xs text-muted-foreground">{formatDateTime(call.id)}</p></div>{call.has_audio ? <Badge variant="outline">Audio</Badge> : null}</Link>)}{(summary?.recentCalls ?? data.calls).length === 0 ? <p className="py-4 text-sm text-muted-foreground">Aucun appel récent.</p> : null}</div></CardContent></Card>
      </div>
      <Link href="/performance" className="flex items-center justify-between border-t py-4 text-sm text-muted-foreground hover:text-primary">Consulter les tendances et les estimations dans Rapports <ArrowRight className="size-4" /></Link>
    </>}
  </div>
}
