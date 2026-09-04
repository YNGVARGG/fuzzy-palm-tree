"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"

export default function DocumentPage() {
  const params = useParams()
  const router = useRouter()
  const { tenantId } = usePractice()
  const file = decodeURIComponent(String(params.file ?? ""))
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    fetch("/api/tenants/" + tenantId + "/documents/" + encodeURIComponent(file))
      .then((r) => (r.ok ? r.text() : null))
      .then(setText)
  }, [tenantId, file])

  const remove = async () => {
    if (!window.confirm("Supprimer ce document ? L'index sera reconstruit.")) return
    await fetch("/api/tenants/" + tenantId + "/documents/" + encodeURIComponent(file), { method: "DELETE" })
    router.push("/documents")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/documents" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Documents</Link>
        <Button variant="outline" size="sm" onClick={remove}><Trash2 className="size-3.5 text-red-500" /> Supprimer</Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="font-mono text-base">{file}</CardTitle></CardHeader>
        <CardContent>
          {text === null ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm leading-relaxed">{text}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
