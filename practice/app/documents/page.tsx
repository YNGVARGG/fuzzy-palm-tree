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
  const { tenantId, refreshTick, demoEnabled } = usePractice()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<FileList | null>(null)
  const [error, setError] = useState("")
  const [docs, setDocs] = useState<Docs | null>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (!tenantId) return
    const controller = new AbortController()
    fetch("/api/tenants/" + tenantId + "/documents", { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((d) => { if (!controller.signal.aborted && d.files) { setDocs(d); setError("") } })
      .catch(() => { if (!controller.signal.aborted) setError("Impossible de charger les documents. Actualisez la page pour réessayer.") })
    return () => controller.abort()
  }, [tenantId, refreshTick])

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0 || uploading || demoEnabled) return
    setUploading(true)
    setMsg("")
    setError("")
    try {
      const form = new FormData()
      for (const f of Array.from(files)) form.append("files", f)
      const r = await fetch("/api/tenants/" + tenantId + "/documents", { method: "POST", body: form })
      const d = await r.json()
      if (!r.ok || !d.saved?.length) throw new Error()
      if (d.indexed >= 0) setMsg("Documents ajoutés : " + d.indexed + " passages disponibles pour les réponses de l’agent.")
      else setError("Documents enregistrés, mais leur préparation a échoué. Ils ne sont pas encore disponibles pour l’agent.")
      const r2 = await fetch("/api/tenants/" + tenantId + "/documents")
      const d2 = await r2.json()
      if (d2.files) setDocs(d2)
    } catch {
      setError("Impossible d’envoyer les documents. Réessayez.")
    }
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-3xl font-semibold tracking-tight">Connaissances</h1><p className="mt-2 text-sm text-muted-foreground">Les documents de référence de votre assistant.</p></div><div className="flex flex-wrap items-end gap-2"></div></header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]"><div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bibliothèque</CardTitle><Input aria-label="Rechercher un document" placeholder="Rechercher par nom…" value={query} onChange={e=>setQuery(e.target.value)} />
          <CardDescription>{docs ? docs.files.length + " document(s) — " + docs.index.chunks + " passage(s) indexé(s)" : "…"}</CardDescription>
        </CardHeader>
        <CardContent>
          {!docs && error ? <p className="text-sm text-muted-foreground">Bibliothèque indisponible.</p> : !docs ? (
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
              <TableBody>{!docs.files.some(f=>f.name.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))) && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Aucun document ne correspond à cette recherche.</TableCell></TableRow>}
                {docs.files.filter(f=>f.name.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))).map((f) => (
                  <TableRow key={f.name}>
                    <TableCell className="font-medium text-sm"><Link href={"/documents/" + encodeURIComponent(f.name)} className="text-primary hover:underline">{f.name}</Link></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} Ko</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div><aside className="space-y-5 xl:sticky xl:top-24">      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter un document</CardTitle>
          <CardDescription>Ajoutez vos horaires, tarifs et consignes au format .txt ou .md.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-primary/25 bg-primary/5 p-5">
            <Input aria-label="Choisir des documents" type="file" accept=".txt,.md" multiple className="max-w-sm" onChange={(e) => setSelected(e.target.files)} disabled={uploading || demoEnabled} />
            <Button onClick={() => upload(selected)} disabled={uploading || demoEnabled || !selected?.length}>
              <Upload className="size-4" /> {uploading ? "Indexation…" : "Envoyer et indexer"}
            </Button>
          </div>
          {msg ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</p> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          {demoEnabled ? <p className="text-sm text-muted-foreground">Quittez le mode démo pour ajouter des documents.</p> : null}
        </CardContent>
      </Card>
<p className="px-1 text-xs leading-relaxed text-muted-foreground">Pour le nom du cabinet, les horaires et l’accueil téléphonique, ouvrez les <Link href="/settings" className="text-primary underline">réglages du cabinet</Link>.</p></aside></div>
    </div>
  )
}
