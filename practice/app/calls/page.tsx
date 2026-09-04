"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, PhoneCall, ShieldAlert, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"
import { cn } from "@/lib/utils"

type Msg = { role?: string; content?: unknown }

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  rdv: { label: "RDV pris", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  question: { label: "Question", cls: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  message: { label: "Message", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  urgence: { label: "Urgence", cls: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  escalation: { label: "Escalade", cls: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  raccrochage: { label: "Raccrochage", cls: "" },
  inconnu: { label: "Appel", cls: "" },
}

const fmtDT = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

export default function CallsPage() {
  const { tenantId } = usePractice()
  const data = usePracticeData()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Record<string, Msg[]>>({})
  const [filter, setFilter] = useState("all")
  const [q, setQ] = useState("")
  const [deleted, setDeleted] = useState<string | null>(null)

  const toggle = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (transcripts[id]) return
    const call = data.calls.find((c) => c.id === id)
    if (call && call.messages) {
      setTranscripts((m) => ({ ...m, [id]: call.messages as Msg[] }))
      return
    }
    const d = await fetch("/api/tenants/" + tenantId + "/calls/" + id.replace("demo-", "")).then((r) => r.json()).catch(() => null)
    if (d && d.messages) setTranscripts((m) => ({ ...m, [id]: d.messages }))
  }

  const removeCall = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cet appel (transcription, résumé et audio) ? Cette action est irréversible et conforme au droit à l'effacement (RGPD).")) return
    const r = await fetch("/api/tenants/" + tenantId + "/calls/" + id.replace("demo-", ""), { method: "DELETE" })
    if (r.ok) { setDeleted(id); setTimeout(() => setDeleted(null), 4000) }
  }

  let calls = data.calls ?? []
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
          {data.loading ? "…" : calls.length + " appels"} · transcription, résumé IA et audio
          {data.demo ? " · données de démonstration" : ""}
        </p>
      </div>

      {!data.loading && calls.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">Tous ({calls.length})</TabsTrigger>
              {Array.from(allTypes).sort().map((t) => (
                <TabsTrigger key={t} value={t}>{TYPE_LABEL[t]?.label ?? t} ({calls.filter((c) => (c.type || "inconnu") === t).length})</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Input placeholder="Rechercher (patient, sujet…)" className="ml-auto w-64" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      ) : null}

      {data.loading ? (
        <div className="flex flex-col gap-3">{["h-24", "h-24", "h-24"].map((h, i) => <Skeleton key={i} className={h} />)}</div>
      ) : calls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground">
            <PhoneCall className="size-6 opacity-40" />
            <p className="font-medium text-foreground">Aucun appel pour le moment</p>
            <p>Activez le mode démo depuis la vue d&apos;ensemble, ou passez un appel à l&apos;agent.</p>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">Aucun appel ne correspond à ce filtre.</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((call) => {
            const t = call.type || "inconnu"
            const tag = TYPE_LABEL[t] ?? TYPE_LABEL.inconnu
            const isDeleted = deleted === call.id
            return (
              <Card key={call.id} className={cn(isDeleted && "opacity-40")}>
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{fmtDT(call.id.replace("demo-", "").replace(/_/g, " ").replace(/-/g, "/"))}</span>
                    <Badge variant="outline" className={tag.cls}>{tag.label}</Badge>
                    {call.patient ? <span className="text-sm font-medium">{call.patient}</span> : null}
                    {call.has_audio ? <Badge variant="outline">Audio</Badge> : null}
                    {call.recording_refused ? (
                      <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400"><ShieldAlert className="size-3" /> Enregistrement refusé</Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    {!data.demo ? (
                      <Button variant="ghost" size="icon" aria-label="Supprimer l'appel" onClick={() => removeCall(call.id)}>
                        <Trash2 className="size-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={() => toggle(call.id)}>
                      {expanded === call.id ? <>Masquer <ChevronUp className="size-3.5" /></> : <>Transcription <ChevronDown className="size-3.5" /></>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {isDeleted ? <p className="text-sm text-emerald-600 dark:text-emerald-400">Appel supprimé (effacement RGPD).</p> : null}
                  {call.summary ? <p className="text-sm">{call.summary}</p> : null}
                  {call.has_audio ? (
                    <audio controls preload="none" className="h-9 w-full" src={"/api/tenants/" + tenantId + "/calls/" + call.id.replace("demo-", "") + "/audio"} />
                  ) : null}
                  {expanded === call.id ? (
                    <div className="mt-1 flex flex-col gap-2">
                      {(transcripts[call.id] ?? []).map((m, i) => {
                        const text = typeof m.content === "string" ? m.content : ""
                        if (!text) return null
                        const isUser = m.role === "user"
                        return (
                          <div key={i} className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm", isUser ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted")}>
                            <p className="text-xs opacity-70">{isUser ? "Patient" : "Agent"}</p>
                            <p>{text}</p>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
