"use client"


import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, PhoneCall, RefreshCw, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
import { formatDateTime, usePaginatedCalls, type OperationalCall } from "@/components/operational-data"

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  rdv: { label: "RDV pris", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  question: { label: "Question", cls: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  message: { label: "Message", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  urgence: { label: "Urgence", cls: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  escalation: { label: "Escalade", cls: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  raccrochage: { label: "Raccrochage", cls: "" },
  inconnu: { label: "Appel", cls: "" },
}

const TYPES = ["rdv", "question", "message", "urgence", "escalation", "raccrochage", "inconnu"]

function CallRow({ call }: { call: OperationalCall }) {
  const type = call.type || call.kind || "inconnu"
  const tag = TYPE_LABEL[type] ?? TYPE_LABEL.inconnu
  const occurredAt = call.at ?? call.created_at ?? call.id
  return (
    <Link
      href={`/calls/${encodeURIComponent(call.id)}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 sm:px-5"
    >
      <span className="hidden w-28 shrink-0 text-sm tabular-nums text-muted-foreground sm:block sm:w-36">{formatDateTime(occurredAt)}</span>
      <Badge variant="outline" className={`shrink-0 ${tag.cls}`}>{tag.label}</Badge>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{call.patient || "Patient inconnu"}</p>
        <p className="truncate text-xs text-muted-foreground">{call.summary || "Sans résumé"}</p>
        <p className="mt-1 text-xs text-muted-foreground sm:hidden">{formatDateTime(occurredAt)}</p>
      </div>
      {call.has_audio ? <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">Audio</Badge> : null}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (page: number) => void }) {
  if (total === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:px-5">
      <span>{total.toLocaleString("fr-FR")} résultat{total > 1 ? "s" : ""}</span>
      <div className="flex items-center gap-2">
        <span>Page {page} sur {totalPages}</span>
        <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Page précédente">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Page suivante">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export default function CallsPage() {
  const { demoEnabled } = usePractice()
  const [q, setQ] = useState("")
  const [type, setType] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const deferredQ = useDeferredValue(q)
  const filterKey = JSON.stringify([deferredQ, type, from, to])
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey)
  if (filterKey !== previousFilterKey) { setPreviousFilterKey(filterKey); setPage(1);  }
  const result = usePaginatedCalls({ q: deferredQ, type, from, to, page })


  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-3xl font-semibold tracking-tight">Journal des appels</h1><p className="mt-2 text-sm text-muted-foreground">Recherchez une conversation et retrouvez son résultat.</p></div><div className="flex flex-wrap items-end gap-2"><Button variant="outline" size="sm" onClick={result.refresh} disabled={result.loading} className="gap-1.5">
          <RefreshCw className="size-3.5" /> Actualiser
        </Button>
      </div></header>

      {demoEnabled ? <p className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">Données de démonstration · ces conversations illustrent le fonctionnement du cabinet.</p> : null}
      <Card size="sm">
        <CardContent className="flex flex-wrap items-end gap-3 py-3">
          <label className="flex min-w-52 flex-1 flex-col gap-1.5 text-xs font-medium">
            Rechercher
            <span className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input aria-label="Rechercher un appel" placeholder="Patient, résumé…" className="pl-8" value={q} onChange={(event) => setQ(event.target.value)} />
            </span>
          </label>
          <label className="flex min-w-40 flex-col gap-1.5 text-xs font-medium">
            Type
            <Select value={type || "all"} onValueChange={(value) => setType(value === "all" ? "" : value ?? "")}>
              <SelectTrigger aria-label="Filtrer par type" className="w-full"><SelectValue>{type ? TYPE_LABEL[type]?.label ?? "Appel" : "Tous les types"}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES.map((item) => <SelectItem key={item} value={item}>{TYPE_LABEL[item].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="flex min-w-36 flex-col gap-1.5 text-xs font-medium">
            Du
            <Input aria-label="Date de début" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="flex min-w-36 flex-col gap-1.5 text-xs font-medium">
            Au
            <Input aria-label="Date de fin" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          {(q || type || from || to) ? (
            <Button variant="ghost" size="sm" onClick={() => { setQ(""); setType(""); setFrom(""); setTo("") }}>Réinitialiser</Button>
          ) : null}
        </CardContent>
      </Card>

      {result.error ? (
        <Card className="border-destructive/30 bg-destructive/5"><CardContent className="flex items-center justify-between gap-3 py-4 text-sm">
          <p>{result.error}</p><Button size="sm" variant="outline" onClick={result.refresh}>Réessayer</Button>
        </CardContent></Card>
      ) : null}

      {result.loading ? (
        <div className="flex flex-col gap-2">{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16" />)}</div>
      ) : result.error ? null : result.items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground">
          <PhoneCall className="size-6 opacity-40" />
          <p className="font-medium text-foreground">Aucun appel trouvé</p>
          <p>{q || type || from || to ? "Modifiez les filtres pour élargir la recherche." : "Les appels entrants apparaîtront ici dès qu’ils seront traités."}</p>
        </CardContent></Card>
      ) : (
        <Card size="sm">
          <CardContent className="flex flex-col divide-y p-0"><div className="flex items-center justify-between gap-3 px-5 py-3"><h2 className="text-sm font-semibold">Conversations</h2><span className="text-xs text-muted-foreground">{result.total.toLocaleString("fr-FR")} résultat(s)</span></div>
            {result.items.map((call) => <CallRow key={call.id} call={call} />)}
          </CardContent>
          <Pager page={result.page} totalPages={result.totalPages} total={result.total} onPage={setPage} />
        </Card>
      )}
    </div>
  )
}
