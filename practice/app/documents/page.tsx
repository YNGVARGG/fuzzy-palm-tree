"use client"

import { useEffect, useState } from "react"
import { FileText, Upload } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePractice } from "@/components/practice-context"

type Docs = { files: { name: string; size: number }[]; index: { chunks: number } }

export default function DocumentsPage() {
  const { tenantId, refreshTick } = usePractice()
  const [docs, setDocs] = useState<Docs | null>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (!tenantId) return
    fetch("/api/tenants/" + tenantId + "/documents")
      .then((r) => r.json())
      .then((d) => { if (d.files) setDocs(d) })
      .catch(() => undefined)
  }, [tenantId, refreshTick])

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setMsg("")
    try {
      const form = new FormData()
      for (const f of Array.from(files)) form.append("files", f)
      const r = await fetch("/api/tenants/" + tenantId + "/documents", { method: "POST", body: form })
      const d = await r.json()
      setMsg(d.indexed && d.indexed >= 0 ? "Documents envoyés et indexés (" + d.indexed + " passages). L'agent peut maintenant répondre à partir de ces documents." : "Envoi ok mais indexation en échec — vérifiez la clé Mistral.")
      const r2 = await fetch("/api/tenants/" + tenantId + "/documents")
      const d2 = await r2.json()
      if (d2.files) setDocs(d2)
    } catch {
      setMsg("Erreur lors de l'envoi.")
    }
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground">L&apos;agent répond aux questions précises (tarifs, garanties, protocoles) à partir de ces documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter un document</CardTitle>
          <CardDescription>Format .txt ou .md — indexation automatique avec recherche sémantique</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input type="file" accept=".txt,.md" multiple className="max-w-sm" onChange={(e) => upload(e.target.files)} disabled={uploading} />
            <Button onClick={() => { const i = document.querySelector<HTMLInputElement>("input[type=file]"); i && upload(i.files) }} disabled={uploading}>
              <Upload className="size-4" /> {uploading ? "Indexation…" : "Envoyer et indexer"}
            </Button>
          </div>
          {msg ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bibliothèque</CardTitle>
          <CardDescription>{docs ? docs.files.length + " document(s) — " + docs.index.chunks + " passage(s) indexé(s)" : "…"}</CardDescription>
        </CardHeader>
        <CardContent>
          {!docs ? (
            <Skeleton className="h-24 w-full" />
          ) : docs.files.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              <FileText className="size-6 opacity-40" />
              <p className="font-medium text-foreground">Aucun document</p>
              <p>Ajoutez par exemple un guide des soins et tarifs — l&apos;agent y répondra au téléphone.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead className="text-right">Taille</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.files.map((f) => (
                  <TableRow key={f.name}>
                    <TableCell className="font-mono text-xs"><Link href={"/documents/" + encodeURIComponent(f.name)} className="text-primary hover:underline">{f.name}</Link></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} Ko</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}