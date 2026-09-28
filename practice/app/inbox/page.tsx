"use client"


import { useDeferredValue, useState } from "react"
import { Check, ChevronLeft, ChevronRight, CircleAlert, Inbox as InboxIcon, Loader2, RefreshCw, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { usePractice } from "@/components/practice-context"
import { formatDateTime, useInboxTasks, type OperationalEvent, type TaskPatch } from "@/components/operational-data"

type StatusFilter = "all" | "open" | "resolved"

function toLocalInput(value: unknown): string {
  if (typeof value !== "string" || !value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T09:00` : ""
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function TaskCard({ task, onSave }: { task: OperationalEvent; onSave: (task: OperationalEvent, patch: TaskPatch) => Promise<boolean> }) {
  const [status, setStatus] = useState<"open" | "resolved">(task.status === "resolved" ? "resolved" : "open")
  const [owner, setOwner] = useState(task.owner ?? "")
  const [priority, setPriority] = useState<"normal" | "urgent">(task.priority === "urgent" ? "urgent" : "normal")
  const [dueAt, setDueAt] = useState(toLocalInput(task.due_at))
  const [notes, setNotes] = useState(task.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    setSaved(false)
    const didSave = await onSave(task, { status, owner: owner.trim(), priority, due_at: dueAt ? new Date(dueAt).toISOString() : "", notes: notes.trim() })
    setSaving(false)
    setSaved(didSave)
  }

  const patient = task.customer_name || "Patient inconnu"
  const detail = task.message || task.service || "Demande reçue par l’agent."
  const received = task.at ? formatDateTime(task.at) : "Date inconnue"

  return (
    <article className="border-b p-4 last:border-b-0 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl ${priority === "urgent" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-primary/10 text-primary"}`}>
            {priority === "urgent" ? <CircleAlert className="size-4" /> : <InboxIcon className="size-4" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{patient}</h2>
              <Badge variant={status === "open" ? "default" : "secondary"}>{status === "open" ? "À traiter" : "Résolu"}</Badge>
              {priority === "urgent" ? <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400">Urgent</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
            <p className="mt-1 text-xs text-muted-foreground">Reçu le {received}{task.phone ? ` · ${task.phone}` : ""}</p>
          </div>
        </div>
        <a href={task.phone ? `tel:${String(task.phone).replace(/\s/g, "")}` : undefined} className={`text-sm font-medium ${task.phone ? "text-primary hover:underline" : "pointer-events-none text-muted-foreground"}`}>{task.phone || "Téléphone non renseigné"}</a>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium">État
          <Select value={status} onValueChange={(value) => setStatus(value === "resolved" ? "resolved" : "open")}>
            <SelectTrigger aria-label={`État de la tâche ${patient}`}><SelectValue>{status === "open" ? "À traiter" : "Résolu"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="open">À traiter</SelectItem><SelectItem value="resolved">Résolu</SelectItem></SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium">Responsable
          <Input aria-label={`Responsable de ${patient}`} placeholder="À attribuer" value={owner} onChange={(event) => setOwner(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium">Priorité
          <Select value={priority} onValueChange={(value) => setPriority(value === "urgent" ? "urgent" : "normal")}>
            <SelectTrigger aria-label={`Priorité de ${patient}`}><SelectValue>{priority === "urgent" ? "Urgente" : "Normale"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="normal">Normale</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium">Échéance
          <Input aria-label={`Échéance de ${patient}`} type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1.5 text-xs font-medium">Notes internes
        <Textarea aria-label={`Notes pour ${patient}`} rows={2} placeholder="Ajouter une note pour l’équipe…" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {saved ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><Check className="size-3.5" /> Enregistré</span> : null}
        <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="size-3.5 animate-spin" /> : null}{saving ? "Enregistrement…" : "Enregistrer"}</Button>
      </div>
    </article>
  )
}

function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (page: number) => void }) {
  if (total === 0) return null
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:px-5"><span>{total.toLocaleString("fr-FR")} tâche{total > 1 ? "s" : ""}</span><div className="flex items-center gap-2"><span>Page {page} sur {totalPages}</span><Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Page précédente"><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Page suivante"><ChevronRight className="size-4" /></Button></div></div>
}

export default function InboxPage() {
  const { demoEnabled } = usePractice()
  const [status, setStatus] = useState<StatusFilter>("open")
  const [q, setQ] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const deferredQ = useDeferredValue(q)
  const filterKey = JSON.stringify([status, deferredQ, from, to])
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey)
  if (filterKey !== previousFilterKey) { setPreviousFilterKey(filterKey); setPage(1); setSelectedId(null); }
  const result = useInboxTasks({ status, q: deferredQ, from, to, page })
  const selected = result.items.find(task => task.id === selectedId)


  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-3xl font-semibold tracking-tight">Boîte de réception</h1><p className="mt-2 text-sm text-muted-foreground">Sélectionnez une demande pour la traiter.</p></div><div className="flex flex-wrap items-end gap-2"><Button variant="outline" size="sm" onClick={result.refresh} disabled={result.loading} className="gap-1.5"><RefreshCw className="size-3.5" /> Actualiser</Button>
      </div></header>

      {demoEnabled ? <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">Mode démo : les changements de tâche sont temporaires et réinitialisés en quittant cette page.</div> : null}

      <Card size="sm">
        <CardContent className="flex flex-wrap items-end gap-3 py-3">
          <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-xs font-medium">Rechercher
            <span className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Rechercher une tâche" placeholder="Patient, message, responsable…" className="pl-8" value={q} onChange={(event) => setQ(event.target.value)} /></span>
          </label>
          <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="État des tâches">
            {(["open", "resolved", "all"] as StatusFilter[]).map((item) => { const label = item === "open" ? "À traiter" : item === "resolved" ? "Résolues" : "Toutes"; return <button key={item} type="button" aria-pressed={status === item} onClick={() => setStatus(item)} className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${status === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{label}</button> })}
          </div>
          <label className="flex min-w-36 flex-col gap-1.5 text-xs font-medium">Du<Input aria-label="Date de début des tâches" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
          <label className="flex min-w-36 flex-col gap-1.5 text-xs font-medium">Au<Input aria-label="Date de fin des tâches" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
          {(q || from || to) ? <Button variant="ghost" size="sm" onClick={() => { setQ(""); setFrom(""); setTo("") }}>Réinitialiser</Button> : null}
        </CardContent>
      </Card>

      {result.error ? <Card className="border-destructive/30 bg-destructive/5"><CardContent className="flex items-center justify-between gap-3 py-4 text-sm"><p>{result.error}</p><Button size="sm" variant="outline" onClick={result.refresh}>Réessayer</Button></CardContent></Card> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)]"><div className="min-w-0">
      {result.loading ? <div className="flex flex-col gap-2">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-20" />)}</div> : result.error && result.items.length === 0 ? null : result.items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground"><Check className="size-6 text-emerald-500" /><p className="font-medium text-foreground">Tout est à jour</p><p>{q || from || to ? "Aucune tâche ne correspond aux filtres." : status === "open" ? "Aucune demande ouverte pour le moment." : "Aucune tâche dans cette vue."}</p></CardContent></Card>
      ) : (
        <Card size="sm">
          <CardContent className="p-0">
            {result.items.map(task=><button key={task.id} type="button" onClick={()=>{setSelectedId(task.id);if(window.innerWidth<1280)requestAnimationFrame(()=>document.getElementById("request-detail")?.scrollIntoView({block:"start"}))}} aria-pressed={selectedId===task.id} className={`grid w-full grid-cols-[minmax(0,1fr)_24px] items-center gap-4 border-b border-l-2 px-5 py-5 text-left transition-colors last:border-b-0 hover:bg-muted/50 ${selectedId===task.id?"border-l-primary bg-primary/5":"border-l-transparent"}`}>
              <span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{task.customer_name||"Patient inconnu"}</span>{task.priority==="urgent"?<Badge variant="outline" className="border-red-400/40 text-red-600 dark:text-red-300">Urgent</Badge>:null}{task.status==="resolved"?<Badge variant="secondary">Résolu</Badge>:null}</span><span className="mt-1 block truncate text-sm text-muted-foreground">{task.message||"Demande de rappel"}</span><span className="mt-1 block text-xs text-muted-foreground">{task.owner||"À attribuer"} · {task.due_at?formatDateTime(task.due_at):"Sans échéance"}</span></span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>)}
          </CardContent>
          <Pager page={result.page} totalPages={result.totalPages} total={result.total} onPage={setPage} />
        </Card>
      )}
      </div><section id="request-detail" aria-label="Détail de la demande" className="min-w-0 scroll-mt-24 rounded-2xl border bg-card xl:sticky xl:top-24">
        <div className="flex items-center justify-between border-b px-5 py-4"><h2 className="text-sm font-semibold">{selected ? "Traiter la demande" : "Détail de la demande"}</h2>{selected ? <Button variant="ghost" size="sm" onClick={()=>setSelectedId(null)}>Fermer</Button> : null}</div>
        {selected ? <TaskCard key={`${selected.id}-${selected.version}`} task={selected} onSave={async(task,patch)=>result.updateTask(task,patch)} /> : <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-center"><InboxIcon className="size-8 text-primary/50"/><p className="font-medium">Une demande, une prochaine action</p><p className="max-w-xs text-sm leading-relaxed text-muted-foreground">Ouvrez un message pour attribuer un responsable, définir une échéance et laisser une note.</p></div>}
      </section></div>
    </div>
  )
}
