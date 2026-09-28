"use client"


import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { CalendarCheck, ChevronDown, ChevronLeft, ChevronRight, Download, Inbox, Phone, RefreshCw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
import { formatDate, formatDateTime, usePaginatedBookings, type OperationalEvent } from "@/components/operational-data"

type View = "all" | "upcoming" | "past"

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (page: number) => void }) {
  if (total === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:px-5">
      <span>{total.toLocaleString("fr-FR")} rendez-vous</span>
      <div className="flex items-center gap-2">
        <span>Page {page} sur {totalPages}</span>
        <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Page précédente"><ChevronLeft className="size-4" /></Button>
        <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Page suivante"><ChevronRight className="size-4" /></Button>
      </div>
    </div>
  )
}

function BookingRow({ booking, open, onToggle }: { booking: OperationalEvent; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 sm:px-5"
      >
        <div className="w-24 shrink-0 sm:w-32">
          <p className="font-heading text-lg font-semibold tabular-nums">{String(booking.time ?? "À confirmer")}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{booking.customer_name || "Patient inconnu"}</p>
          <p className="truncate text-xs text-muted-foreground">{booking.service || "Service non renseigné"}</p>
        </div>
        <span className="hidden text-right text-xs text-muted-foreground sm:block">{booking.reference ? `Réf. ${booking.reference}` : ""}</span>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="grid gap-3 bg-muted/30 px-4 pb-4 pt-1 text-sm sm:grid-cols-3 sm:px-5">
          <div><p className="text-xs text-muted-foreground">Patient</p><p className="font-medium">{booking.customer_name || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Téléphone</p>{booking.phone ? <a href={`tel:${String(booking.phone).replace(/\s/g, "")}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline"><Phone className="size-3.5" /> {booking.phone}</a> : <p>—</p>}</div>
          <div><p className="text-xs text-muted-foreground">Réservé le</p><p>{formatDateTime(booking.at)}</p></div>
          <div><p className="text-xs text-muted-foreground">Soin ou service</p><p>{booking.service || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Référence</p><p className="font-mono text-xs">{booking.reference || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Source</p><p>{booking.kind === "appointment_booked" ? "Réservé par l’agent" : "Activité du cabinet"}</p></div>
        </div>
      ) : null}
    </div>
  )
}

export default function BookingsPage() {
  const { tenantId, demoEnabled } = usePractice()
  const [view, setView] = useState<View>("upcoming")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)
  const deferredQ = useDeferredValue(q)
  const [today] = useState(() => localDateKey())
  const [yesterday] = useState(() => { const date = new Date(); date.setDate(date.getDate() - 1); return localDateKey(date) })
  const from = view === "upcoming" ? today : ""
  const to = view === "past" ? yesterday : ""
  const filterKey = JSON.stringify([deferredQ, view])
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey)
  if (filterKey !== previousFilterKey) { setPreviousFilterKey(filterKey); setPage(1); setOpenId(null); }
  const result = usePaginatedBookings({ q: deferredQ, from, to, page })


  const dateGroups = Map.groupBy(result.items, booking => String(booking.date ?? "Date à confirmer"))

  const exportCsv = () => {
    if(!demoEnabled){window.location.href=`/api/tenants/${encodeURIComponent(tenantId)}/bookings-export?${new URLSearchParams({q:deferredQ,from,to})}`;return}
    const head = ["reference", "date", "heure", "soin", "patient", "telephone", "pris_le"]
    const rows = result.items.map((booking) => [booking.reference, booking.date, booking.time, booking.service, booking.customer_name, booking.phone, booking.at].map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    const csv = "\uFEFF" + [head.join(","), ...rows].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `rendez-vous-${today}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-3xl font-semibold tracking-tight">Rendez-vous</h1><p className="mt-2 text-sm text-muted-foreground">Les demandes enregistrées, classées par date.</p></div><div className="flex flex-wrap items-end gap-2"><Button variant="outline" size="sm" onClick={result.refresh} disabled={result.loading} className="gap-1.5"><RefreshCw className="size-3.5" /> Actualiser</Button>
          {result.items.length > 0 ? <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5"><Download className="size-3.5" /> {demoEnabled?"Exporter la page démo":"Exporter les résultats"}</Button> : null}
        </div></header>

      {demoEnabled ? <p className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">Données de démonstration · les rendez-vous affichés sont des exemples.</p> : null}
      <Card size="sm">
        <CardContent className="flex flex-wrap items-end gap-3 py-3">
          <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-xs font-medium">
            Rechercher
            <span className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Rechercher un rendez-vous" placeholder="Patient, soin, téléphone…" className="pl-8" value={q} onChange={(event) => setQ(event.target.value)} /></span>
          </label>
          <div className="flex rounded-full bg-muted p-1" role="group" aria-label="Période des rendez-vous">
            {(["upcoming", "past", "all"] as View[]).map((item) => {
              const label = item === "upcoming" ? "À venir" : item === "past" ? "Passés" : "Tous"
              return <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${view === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
            })}
          </div>
          {q ? <Button variant="ghost" size="sm" onClick={() => setQ("")}>Réinitialiser</Button> : null}
        </CardContent>
      </Card>

      {result.error ? <Card className="border-destructive/30 bg-destructive/5"><CardContent className="flex items-center justify-between gap-3 py-4 text-sm"><p>{result.error}</p><Button size="sm" variant="outline" onClick={result.refresh}>Réessayer</Button></CardContent></Card> : null}

      {result.loading ? <Skeleton className="h-72 w-full" /> : result.error ? null : result.items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground"><CalendarCheck className="size-6 opacity-40" /><p className="font-medium text-foreground">Aucun rendez-vous trouvé</p><p>{q ? "Modifiez votre recherche pour élargir les résultats." : view === "upcoming" ? "Les prochains rendez-vous réservés par l’agent apparaîtront ici." : "Aucun rendez-vous dans cette période."}</p></CardContent></Card>
      ) : (
        <Card size="sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Demandes de rendez-vous</CardTitle><CardDescription>Ouvrez un rendez-vous pour consulter les coordonnées et sa référence.</CardDescription></CardHeader>
          <CardContent className="p-0">
            {Array.from(dateGroups, ([date, bookings]) => <section key={date} aria-label={formatDate(date)}><div className="flex items-center justify-between border-y bg-muted/50 px-5 py-3"><h3 className="text-sm font-semibold">{formatDate(date)}</h3><span className="text-xs text-muted-foreground">{bookings.length} sur cette page</span></div>{bookings.map(booking=><BookingRow key={booking.id} booking={booking} open={openId===booking.id} onToggle={()=>setOpenId(openId===booking.id?null:booking.id)}/>)}</section>)}
          </CardContent>
          <Pager page={result.page} totalPages={result.totalPages} total={result.total} onPage={setPage} />
        </Card>
      )}

      <Card size="sm" className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="flex items-center gap-2"><Inbox className="size-4 text-primary" /><div><p className="text-sm font-medium">Une demande attend une réponse ?</p><p className="text-xs text-muted-foreground">Retrouvez les rappels, messages et escalades dans la boîte de réception.</p></div></div><Link href="/inbox"><Button variant="outline" size="sm">Ouvrir la boîte de réception</Button></Link></CardContent>
      </Card>
    </div>
  )
}
