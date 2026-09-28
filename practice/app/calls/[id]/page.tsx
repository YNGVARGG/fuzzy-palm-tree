"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Loader2, PhoneCall, ShieldAlert, Trash2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
import { formatDateTime, type ConversationMessage, type OperationalCall } from "@/components/operational-data"
import { usePracticeData } from "@/components/use-practice-data"
import { cn } from "@/lib/utils"

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  rdv: { label: "RDV pris", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  question: { label: "Question", cls: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  message: { label: "Message", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  urgence: { label: "Urgence", cls: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  escalation: { label: "Escalade", cls: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  raccrochage: { label: "Raccrochage", cls: "" },
  inconnu: { label: "Appel", cls: "" },
}

type CallDetail = {
  id?: string
  summary?: string | null
  meta?: { type?: string; patient?: string; recording_refused?: boolean } | null
  has_audio?: boolean
  messages?: ConversationMessage[] | null
}

export default function CallDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { tenantId, demoEnabled } = usePractice()
  const data = usePracticeData()
  const id = String(params.id ?? "")
  const fromHook = data.calls.find((call) => call.id === id) as OperationalCall | undefined
  const [single, setSingle] = useState<CallDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (demoEnabled || !tenantId || !id || id.startsWith("demo-")) return
    const controller = new AbortController()
    let active = true
    setDetailLoading(true)
    setSingle(null)
    setDetailError(null)
    fetch(`/api/tenants/${encodeURIComponent(tenantId)}/calls/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error ? String(payload.error) : "Impossible de charger la transcription.")
        return payload as CallDetail
      })
      .then((payload) => { if (active) setSingle(payload) })
      .catch((reason: unknown) => {
        if (!active || (reason instanceof DOMException && reason.name === "AbortError")) return
        setDetailError(reason instanceof Error ? reason.message : "Impossible de charger la transcription.")
      })
      .finally(() => { if (active) setDetailLoading(false) })
    return () => { active = false; controller.abort() }
  }, [tenantId, id, demoEnabled])

  const detail = demoEnabled ? null : single
  const type = fromHook?.type ?? fromHook?.kind ?? detail?.meta?.type ?? "inconnu"
  const patient = fromHook?.patient ?? detail?.meta?.patient ?? ""
  const summary = fromHook?.summary ?? detail?.summary ?? ""
  const hasAudio = fromHook?.has_audio ?? detail?.has_audio ?? false
  const refused = fromHook?.recording_refused ?? detail?.meta?.recording_refused ?? false
  const messages = (detail?.messages ?? fromHook?.messages ?? []).filter(m=>m.role==="user"||m.role==="assistant")
  const tag = TYPE_LABEL[type] ?? TYPE_LABEL.inconnu
  const loading = data.loading && !fromHook && !detail

  const removeCall = async () => {
    if (!tenantId || deleting || !window.confirm("Supprimer définitivement cet appel (transcription, résumé et audio) ? Cette action est irréversible.")) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/calls/${encodeURIComponent(id)}`, { method: "DELETE" })
      if (response.ok) router.push("/calls")
      else setDetailError("Impossible de supprimer cet appel.")
    } catch {
      setDetailError("Impossible de supprimer cet appel.")
    } finally {
      setDeleting(false)
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ id, type, patient, summary, messages, refused }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `appel-${id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/calls" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Tous les appels</Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportJson} className="gap-1.5"><Download className="size-3.5" /> Exporter</Button>
          {!demoEnabled ? <Button variant="outline" size="sm" onClick={removeCall} disabled={deleting} className="gap-1.5"><Trash2 className="size-3.5 text-red-500" /> {deleting ? "Suppression…" : "Supprimer"}</Button> : null}
        </div>
      </div>

      {detailError ? <Card className="border-destructive/30 bg-destructive/5"><CardContent className="py-3 text-sm">{detailError}</CardContent></Card> : null}
      {loading ? <Skeleton className="h-64 w-full" /> : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{patient || "Patient inconnu"}</CardTitle>
                <Badge variant="outline" className={tag.cls}>{tag.label}</Badge>
                {hasAudio ? <Badge variant="outline">Audio</Badge> : null}
                {refused ? <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400"><ShieldAlert className="size-3" /> Enregistrement refusé</Badge> : null}
                {detailLoading ? <Badge variant="secondary" className="gap-1"><Loader2 className="size-3 animate-spin" /> Transcription…</Badge> : null}
              </div>
              <CardDescription>{formatDateTime(fromHook?.at ?? fromHook?.created_at ?? detail?.id ?? id, true)}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {summary ? <p className="text-sm">{summary}</p> : null}
              {hasAudio ? <audio controls preload="none" className="h-10 w-full" src={`/api/tenants/${encodeURIComponent(tenantId)}/calls/${encodeURIComponent(id)}/audio`} /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Conversation</CardTitle><CardDescription>Échanges entre le patient et votre réceptionniste.</CardDescription></CardHeader>
            <CardContent>
              {detailLoading && messages.length === 0 ? <div className="flex flex-col gap-2"><Skeleton className="h-12 w-4/5" /><Skeleton className="ml-auto h-12 w-3/4" /></div> : messages.length === 0 ? <p className="text-sm text-muted-foreground">Aucune transcription disponible pour cet appel.</p> : (
                <div className="flex flex-col gap-2">
                  {messages.map((message, index) => {
                    const text = typeof message.content === "string" ? message.content : ""
                    if (!text) return null
                    const isPatient = message.role === "user"
                    return <div key={index} className={cn("max-w-[90%] break-words rounded-xl px-4 py-3 text-base", isPatient ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted")}><p className="text-xs opacity-70">{isPatient ? "Patient" : "Agent"}</p><p>{text}</p></div>
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
