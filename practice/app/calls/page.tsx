"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, PhoneCall, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  rdv: { label: "RDV pris", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  question: { label: "Question", cls: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  message: { label: "Message", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  urgence: { label: "Urgence", cls: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  escalation: { label: "Escalade", cls: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  raccrochage: { label: "Raccrochage", cls: "" },
  inconnu: { label: "Appel", cls: "" },
}

const fmtDT = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

export default function CallsPage() {
  const { tenantId } = usePractice()
  const data = usePracticeData()
  const [filter, setFilter] = useState("all")
  const [q, setQ] = useState("")

  const calls = data.calls ?? []
  const allTypes = new Set(calls.map((c) => c.type || "inconnu"))
  const visible = calls.filter((c) => {
    const t = c.type || "inconnu"
    if (filter !== "all" && t !== filter) return false
    if (q) {
      const hay = ((c.summary || "") + " " + (c.patient || "")).toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Appels</h1>
        <p className="text-sm text-muted-foreground">
          {data.loading ? "…" : calls.length + " appels"} — cliquez pour le détail complet
          {data.demo ? " · données de démonstration" : ""}
        </p>
      </div>

      {!data.loading && calls.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">Tous ({calls.length})</TabsTrigger>
              {Array.from(allTypes).sort().map((t) => (
                <TabsTrigger key={t} value={t}>{TYPE_LABEL[t]?.label ?? t}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Rechercher un patient…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      ) : null}

      {data.loading ? (
        <div className="flex flex-col gap-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : calls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground">
            <PhoneCall className="size-6 opacity-40" />
            <p className="font-medium text-foreground">Aucun appel pour le moment</p>
            <p>Activez le mode démo depuis la vue d&apos;ensemble, ou passez un appel à l&apos;agent.</p>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card><CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">Aucun appel ne correspond à ce filtre.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col divide-y p-0">
            {visible.map((call) => {
              const t = call.type || "inconnu"
              const tag = TYPE_LABEL[t] ?? TYPE_LABEL.inconnu
              return (
                <Link key={call.id} href={"/calls/" + call.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                  <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">{fmtDT(call.id.replace("demo-", "").replace(/_/g, " ").replace(/-/g, "/"))}</span>
                  <Badge variant="outline" className={"shrink-0 " + tag.cls}>{tag.label}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{call.patient || "Patient inconnu"}</p>
                    <p className="truncate text-xs text-muted-foreground">{call.summary || "Sans résumé"}</p>
                  </div>
                  {call.has_audio ? <Badge variant="outline" className="shrink-0">Audio</Badge> : null}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
