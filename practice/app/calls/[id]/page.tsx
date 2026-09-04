"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, PhoneCall, ShieldAlert, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
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

const fmtDT = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

export default function CallDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { tenantId } = usePractice()
  const data = usePracticeData()
  const id = String(params.id ?? "")
  const [single, setSingle] = useState<{ summary: string; meta?: { type?: string; patient?: string; recording_refused?: boolean }; has_audio?: boolean; messages?: { role?: string; content?: unknown }[] } | null>(null)

  const fromHook = data.calls.find((c) => c.id === id)

  useEffect(() => {
    if (data.demo || fromHook || !tenantId) return
    if (id.startsWith("demo-")) return
    fetch("/api/tenants/" + tenantId + "/calls/" + id)
      .then((r) => r.json())
      .then((d) => { if (d && d.summary !== undefined) setSingle(d) })
      .catch(() => undefined)
  }, [tenantId, id, data.demo, fromHook])

  const call = fromHook
  const type = call?.type ?? single?.meta?.type ?? "inconnu"
  const patient = call?.patient ?? single?.meta?.patient ?? ""
  const summary = call?.summary ?? single?.summary ?? ""
  const hasAudio = call?.has_audio ?? single?.has_audio ?? false
  const refused = call?.recording_refused ?? single?.meta?.recording_refused ?? false
  const messages = call?.messages ?? single?.messages ?? []
  const tag = TYPE_LABEL[type] ?? TYPE_LABEL.inconnu
  const loading = data.loading && !fromHook && !single

  const removeCall = async () => {
    if (!window.confirm("Supprimer définitivement cet appel (transcription, résumé et audio) ? Irréversible (RGPD).")) return
    const r = await fetch("/api/tenants/" + tenantId + "/calls/" + id.replace("demo-", ""), { method: "DELETE" })
    if (r.ok) router.push("/calls")
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ id, type, patient, summary, messages, refused }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "appel-" + id + ".json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/calls" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Tous les appels
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportJson}><Download className="size-3.5" /> Exporter</Button>
          {!data.demo ? (
            <Button variant="outline" size="sm" onClick={removeCall}><Trash2 className="size-3.5 text-red-500" /> Supprimer</Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{patient || "Patient inconnu"}</CardTitle>
                <Badge variant="outline" className={tag.cls}>{tag.label}</Badge>
                {hasAudio ? <Badge variant="outline">Audio</Badge> : null}
                {refused ? (
                  <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400"><ShieldAlert className="size-3" /> Enregistrement refusé</Badge>
                ) : null}
              </div>
              <CardDescription>{fmtDT(id.replace("demo-", "").replace(/_/g, " ").replace(/-/g, "/"))}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {summary ? <p className="text-sm">{summary}</p> : null}
              {hasAudio ? (
                <audio controls preload="none" className="h-10 w-full" src={"/api/tenants/" + tenantId + "/calls/" + id.replace("demo-", "") + "/audio"} />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Transcription</CardTitle></CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune transcription disponible pour cet appel.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((m, i) => {
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
