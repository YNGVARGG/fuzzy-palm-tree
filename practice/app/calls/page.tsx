"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, PhoneCall } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"
import { cn } from "@/lib/utils"

const fmtDT = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

export default function CallsPage() {
  const { tenantId } = usePractice()
  const data = usePracticeData()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Record<string, { role?: string; content?: unknown }[]>>({})

  useEffect(() => {
    if (!tenantId) return
    fetch("/api/tenants/" + tenantId + "/calls")
      .then((r) => r.json())
      .then((d) => { if (!data.demo) setTranscripts({}) })
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, data.demo])

  const toggle = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (transcripts[id]) return
    const call = data.calls.find((c) => c.id === id)
    if (call && call.messages) {
      setTranscripts((m) => ({ ...m, [id]: call.messages as { role?: string; content?: unknown }[] }))
      return
    }
    const d = await fetch("/api/tenants/" + tenantId + "/calls/" + id.replace("demo-", "")).then((r) => r.json()).catch(() => null)
    if (d && d.messages) setTranscripts((m) => ({ ...m, [id]: d.messages }))
  }

  const calls = data.calls ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Appels</h1>
        <p className="text-sm text-muted-foreground">
          Chaque appel : transcription, résumé généré par l&apos;IA et audio
          {data.demo ? " · données de démonstration" : ""}
        </p>
      </div>

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
      ) : (
        <div className="flex flex-col gap-3">
          {calls.map((call) => (
            <Card key={call.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{fmtDT(call.id.replace("demo-", "").replace(/_/g, " ").replace(/-/g, "/"))}</span>
                  <Badge variant="outline">{call.message_count} messages</Badge>
                  {call.has_audio ? <Badge>Audio</Badge> : null}
                  {data.demo ? <Badge variant="secondary">Démo</Badge> : null}
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggle(call.id)}>
                  {expanded === call.id ? <>Masquer <ChevronUp className="size-3.5" /></> : <>Transcription <ChevronDown className="size-3.5" /></>}
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
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
          ))}
        </div>
      )}
    </div>
  )
}
