"use client"

import { useEffect, useState } from "react"
import { Download, Save, Building2, MessageCircle, Stethoscope, Eye, ArrowRight, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { usePractice } from "@/components/practice-context"

function formFromTenant(tenant: ReturnType<typeof usePractice>["tenant"]) {
  return {
      name: tenant?.name ?? "",
      tagline: tenant?.tagline ?? "",
      greeting_name: tenant?.greeting_name ?? "Sophie",
      language: tenant?.language ?? "fr",
      hours: tenant?.hours ?? "",
      after_hours_note: tenant?.after_hours_note ?? "",
      booking_slots: tenant?.booking_slots ?? "",
      callback_promise: tenant?.callback_promise ?? "",
      services: (tenant?.services ?? []).join("\n"),
      faq: Object.entries(tenant?.faq ?? {}).map(([k, v]) => k + ": " + v).join("\n"),
      avg_appointment_value: String(tenant?.avg_appointment_value ?? ""),
      missed_calls_per_month: String(tenant?.missed_calls_per_month ?? ""),
      providers: (tenant?.providers ?? []).join("\n"),
      insurance: tenant?.insurance ?? "",
      languages: (tenant?.languages ?? ["fr"]).join(", "),
    }
}

export default function SettingsPage() {
  const { tenantId, demoEnabled } = usePractice()
  return <SettingsContent key={`${tenantId}:${demoEnabled}`} />
}

function SettingsContent() {
  const { tenant, tenantId, refresh, demoEnabled, setDemoEnabled } = usePractice()
  const [section,setSection] = useState("profile")
  const [draft, setDraft] = useState<ReturnType<typeof formFromTenant> | null>(null)
  const f = draft ?? formFromTenant(tenant)
  const setF = (update: (current: typeof f) => typeof f) => setDraft(current => update(current ?? formFromTenant(tenant)))
  const [msg, setMsg] = useState("")
  const [saving, setSaving] = useState(false)
  const [cal, setCal] = useState<{ configured: boolean; calendar_id?: string } | null>(null)
  const [dangerMsg, setDangerMsg] = useState("")

  useEffect(() => {
    fetch("/api/config/calendar").then((r) => r.json()).then(setCal).catch(() => undefined)
  }, [])


  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }))

  const save = async () => {
    if(saving || !tenantId || !tenant)return
    if(demoEnabled){setMsg("Quittez le mode démo pour modifier le cabinet.");return}
    const faq: Record<string, string> = {}
    for (const line of f.faq.split("\n")) {
      const i = line.indexOf(":")
      if (i > 0) {
        const k = line.slice(0, i).trim()
        const v = line.slice(i + 1).trim()
        if (k && v) faq[k] = v
      }
    }
    const body: Record<string, unknown> = {
      name: f.name, tagline: f.tagline, greeting_name: f.greeting_name, language: f.language,
      hours: f.hours, after_hours_note: f.after_hours_note, booking_slots: f.booking_slots,
      callback_promise: f.callback_promise,
      services: f.services.split("\n").map((s) => s.trim()).filter(Boolean),
      faq,
    }
    const avg = parseFloat(f.avg_appointment_value)
    if (isFinite(avg)) body.avg_appointment_value = avg
    const missed = parseInt(f.missed_calls_per_month, 10)
    if (isFinite(missed)) body.missed_calls_per_month = missed
    body.providers = f.providers.split("\n").map((s) => s.trim()).filter(Boolean)
    body.insurance = f.insurance
    body.languages = f.languages.split(",").map((s) => s.trim()).filter(Boolean)
    setSaving(true)
    setMsg("")
    try {
    const r = await fetch("/api/tenants/" + tenantId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (r.ok) {
      setMsg("Enregistré — l'agent appliquera ces informations dès le prochain appel.")
      setTimeout(() => setMsg(""), 5000)
      refresh()
    } else {
      setMsg("Erreur lors de l'enregistrement.")
    }
    } catch { setMsg("Impossible d’enregistrer. Vérifiez la connexion et réessayez.") }
    finally { setSaving(false) }
  }

  const purgeCalls = async (days: number) => {
    const label = days > 0 ? "Supprimer tous les appels de plus de " + days + " jours (audio compris) ?" : "Supprimer TOUS les appels enregistrés (audio compris) ?"
    if (!window.confirm(label + " Cette action est irréversible.")) return
    const url = "/api/tenants/" + tenantId + "/calls" + (days > 0 ? "?days=" + days : "?all=true")
    const r = await fetch(url, { method: "DELETE" })
    setDangerMsg(r.ok ? "Appels supprimés." : "Erreur lors de la suppression.")
  }

  const deletePractice = async () => {
    const name = tenant?.name ?? ""
    const typed = window.prompt("Suppression définitive de ce cabinet et de TOUTES ses données (appels, enregistrements, documents, rendez-vous). Tapez le nom du cabinet pour confirmer :")
    if (typed === null) return
    if (typed.trim() !== name.trim()) {
      setDangerMsg("Le nom saisi ne correspond pas — suppression annulée.")
      return
    }
    const r = await fetch("/api/tenants/" + tenantId, { method: "DELETE" })
    if (r.ok) {
      if (typeof window !== "undefined") window.localStorage.removeItem("practice-id")
      window.location.href = "/"
    } else {
      setDangerMsg("Erreur lors de la suppression.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Votre cabinet</h1>
          <p className="text-sm text-muted-foreground">Personnalisez votre accueil et les informations transmises aux patients.</p>
        </div>

      </div>

      

      <div className="flex flex-wrap gap-2" role="group" aria-label="Sections des réglages">{[{id:"profile",label:"Cabinet et accueil"},{id:"calendar",label:"Agenda"},{id:"data",label:"Données"}].map(item=><Button key={item.id} variant={section===item.id?"default":"outline"} aria-pressed={section===item.id} onClick={()=>setSection(item.id)}>{item.label}</Button>)}</div>
      {demoEnabled?<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="flex items-start gap-3"><Eye className="mt-0.5 size-5 text-primary"/><div><p className="text-sm font-semibold">Vous explorez le mode démo</p><p className="mt-1 text-sm text-muted-foreground">Les modifications sont désactivées. Passez à votre cabinet pour enregistrer vos réglages.</p></div></div><Button variant="outline" onClick={()=>setDemoEnabled(false)}>Passer à mon cabinet <ArrowRight className="size-4"/></Button></div>:null}
      <div hidden={section!=="profile"}>
        {!tenant ? <div className="space-y-4" role="status" aria-label="Chargement des réglages"><Skeleton className="h-40 w-full"/><Skeleton className="h-64 w-full"/></div> : <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
          <form onSubmit={e=>{e.preventDefault();void save()}} className="space-y-5">
            <fieldset disabled={demoEnabled || saving} className="min-w-0 space-y-5 disabled:opacity-65">
              <Card className="rounded-2xl"><CardHeader><CardTitle className="flex items-center gap-3 text-base"><Building2 className="size-5 text-primary"/>Le cabinet</CardTitle><CardDescription>Les informations de référence pour accueillir vos patients.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="clinic-name">Nom du cabinet</Label><Input id="clinic-name" required value={f.name} onChange={set("name")} placeholder="Cabinet dentaire Saint-Michel"/></div>
                <div className="space-y-2"><Label htmlFor="clinic-tagline">Présentation en une phrase</Label><Input id="clinic-tagline" value={f.tagline} onChange={set("tagline")} placeholder="Cabinet dentaire au cœur du quartier"/></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="clinic-hours">Horaires d’ouverture</Label><Textarea id="clinic-hours" rows={2} value={f.hours} onChange={set("hours")} placeholder="Du lundi au vendredi, de 9 h à 18 h"/><p className="text-xs text-muted-foreground">Précisez les pauses, les jours fermés et les exceptions utiles.</p></div>
              </CardContent></Card>
              <Card className="rounded-2xl"><CardHeader><CardTitle className="flex items-center gap-3 text-base"><MessageCircle className="size-5 text-primary"/>L’accueil téléphonique</CardTitle><CardDescription>La manière dont votre assistant se présente et prend les demandes.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="assistant-name">Prénom de l’assistant</Label><Input id="assistant-name" value={f.greeting_name} onChange={set("greeting_name")}/></div>
                <div className="space-y-2"><Label htmlFor="assistant-language">Langue principale</Label><Select disabled={demoEnabled || saving} value={f.language} onValueChange={v=>setF(x=>({...x,language:v??"fr"}))}><SelectTrigger id="assistant-language" className="w-full rounded-xl"><SelectValue>{f.language==="fr"?"Français":f.language==="en"?"Anglais":f.language}</SelectValue></SelectTrigger><SelectContent><SelectItem value="fr">Français</SelectItem><SelectItem value="en">Anglais</SelectItem></SelectContent></Select></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="assistant-after-hours">Quand le cabinet est fermé</Label><Textarea id="assistant-after-hours" rows={3} value={f.after_hours_note} onChange={set("after_hours_note")} placeholder="Expliquez comment traiter les demandes hors horaires."/></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="assistant-callback">Consigne de rappel</Label><Input id="assistant-callback" value={f.callback_promise} onChange={set("callback_promise")}/><p className="text-xs text-muted-foreground">Indiquez uniquement un délai que votre équipe peut tenir.</p></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="assistant-booking">Consignes de rendez-vous</Label><Textarea id="assistant-booking" rows={2} value={f.booking_slots} onChange={set("booking_slots")}/><p className="text-xs text-muted-foreground">Ces consignes ne remplacent pas les disponibilités vérifiées dans un agenda.</p></div>
              </CardContent></Card>
              <Card className="rounded-2xl"><CardHeader><CardTitle className="flex items-center gap-3 text-base"><Stethoscope className="size-5 text-primary"/>Soins et équipe</CardTitle><CardDescription>Ce que l’assistant peut expliquer à propos de votre cabinet.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="clinic-services">Soins proposés</Label><Textarea id="clinic-services" rows={4} value={f.services} onChange={set("services")}/><p className="text-xs text-muted-foreground">Un soin par ligne.</p></div>
                <div className="space-y-2"><Label htmlFor="clinic-providers">Praticiens</Label><Textarea id="clinic-providers" rows={4} value={f.providers} onChange={set("providers")}/><p className="text-xs text-muted-foreground">Un praticien par ligne.</p></div>
                <div className="space-y-2"><Label htmlFor="clinic-insurance">Paiement et mutuelles</Label><Input id="clinic-insurance" value={f.insurance} onChange={set("insurance")} placeholder="Tiers payant, moyens de paiement…"/></div>
                <div className="space-y-2"><Label htmlFor="clinic-languages">Autres langues prises en charge</Label><Input id="clinic-languages" value={f.languages} onChange={set("languages")} placeholder="fr, en"/><p className="text-xs text-muted-foreground">Codes séparés par des virgules : fr (français), en (anglais). Chaque langue doit être testée avec la voix choisie.</p></div>
                <div className="sm:col-span-2"><details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">Questions fréquentes et indicateurs</summary><div className="mt-5 space-y-5"><div className="space-y-2"><Label htmlFor="clinic-faq">Réponses approuvées par le cabinet</Label><Textarea id="clinic-faq" rows={8} value={f.faq} onChange={set("faq")}/><p className="text-xs text-muted-foreground">Une ligne par réponse, sous la forme « Question : réponse ».</p></div><div className="space-y-2"><Label htmlFor="clinic-value">Valeur moyenne d’un rendez-vous (€)</Label><Input id="clinic-value" type="number" min="0" value={f.avg_appointment_value} onChange={set("avg_appointment_value")}/><p className="text-xs text-muted-foreground">Utilisée pour les estimations du tableau de bord.</p></div></div></details></div>
              </CardContent></Card>
            </fieldset>
            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/95 p-4 shadow-sm backdrop-blur"><p role="status" aria-live="polite" className="text-sm text-muted-foreground">{msg || "Enregistrez pour appliquer vos modifications aux prochains appels."}</p><Button type="submit" disabled={demoEnabled || saving || !tenantId}><Save className="size-4"/>{saving?"Enregistrement…":"Enregistrer les modifications"}</Button></div>
          </form>
          <aside className="space-y-4 xl:sticky xl:top-6"><Card className="rounded-2xl border-primary/15 bg-primary/5"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Phone className="size-4 text-primary"/>Aperçu de l’accueil</CardTitle><CardDescription>Exemple de formulation, selon vos réglages.</CardDescription></CardHeader><CardContent><p className="font-heading text-xl leading-relaxed">{f.language==="en"?`“Thanks for calling ${f.name || "the practice"}, I’m ${f.greeting_name || "your assistant"}, the practice’s AI assistant. How can I help?”`:`« Merci d’appeler ${f.name || "votre cabinet"}, je suis ${f.greeting_name || "votre assistant"}, l’assistant IA du cabinet. Comment puis-je vous aider ? »`}</p><span className="mt-5 inline-block rounded-full border border-primary/15 bg-background px-3 py-1 text-xs">{f.language==="fr"?"Français":f.language==="en"?"Anglais":f.language}</span></CardContent></Card><p className="px-2 text-xs leading-relaxed text-muted-foreground">L’aperçu illustre le message d’accueil. Un test vocal permet de vérifier la prononciation, le rythme et les réponses.</p></aside>
        </div>}
      </div>

      {section === "calendar" && <Card>
        <CardHeader>
          <CardTitle className="text-base">Agenda connecté</CardTitle>
          <CardDescription>Les rendez-vous réservés par l&apos;agent peuvent être créés directement dans votre calendrier</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {cal === null ? (
            <Skeleton className="h-14 w-full" />
          ) : cal.configured ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <span className="size-2 rounded-full bg-emerald-500" />
              <p>Configuration Google Agenda détectée. Vérifiez la présence des rendez-vous dans votre agenda avant de les confirmer aux patients.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-xl border p-3">
                <span className="size-2 rounded-full bg-amber-500" />
                <p>Non connecté — les rendez-vous restent dans le tableau de bord.</p>
              </div>
              <p className="text-muted-foreground">La connexion à votre agenda doit être configurée avec votre interlocuteur technique avant de confirmer automatiquement des rendez-vous.</p>
            </div>
          )}
        </CardContent>
      </Card>}

      {section === "data" && <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestion des données</CardTitle>
          <CardDescription>Export et suppression des données de ce cabinet.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ul className="list-inside list-disc space-y-1.5 text-muted-foreground">
            <li>Les règles de traitement et de conservation doivent être définies avec votre cabinet.</li>
            <li>Transcriptions et enregistrements peuvent contenir des données de santé (art. 9 RGPD).</li>
            <li>Effacement : supprimez un appel depuis la page Appels, ou purgez ci-dessous.</li>
            <li>Portabilité : exportez toutes les données du cabinet ci-dessous.</li>
            <li>La suppression est manuelle. Aucune durée de conservation automatique n’est configurée ici.</li>
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <a href={"/api/tenants/" + tenantId + "/export"} download>
              <Button variant="outline" size="sm"><Download className="size-3.5" /> Exporter toutes mes données (JSON)</Button>
            </a>
          </div>
          <Separator />
          <p className="text-muted-foreground">Rétention : la purge est définitive (audio compris).</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={demoEnabled} onClick={() => purgeCalls(30)}>Supprimer les appels de plus de 30 jours</Button>
            <Button variant="outline" size="sm" disabled={demoEnabled} onClick={() => purgeCalls(0)}>Supprimer tous les appels enregistrés</Button>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">Supprimer ce cabinet</p>
              <p className="text-xs text-muted-foreground">Efface toutes les données : appels, enregistrements, transcriptions, documents, rendez-vous et configuration. Irréversible.</p>
            </div>
            <Button variant="destructive" size="sm" disabled={demoEnabled} onClick={deletePractice}>Supprimer définitivement</Button>
          </div>
          {dangerMsg ? <p className="text-sm text-muted-foreground">{dangerMsg}</p> : null}
        </CardContent>
      </Card>}
    </div>
  )
}
