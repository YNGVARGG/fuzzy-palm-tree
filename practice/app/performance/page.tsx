"use client"

import { useEffect, useState } from "react"
import { AreaChart,Area,ResponsiveContainer,XAxis,YAxis,CartesianGrid,Tooltip } from "recharts"
import { CalendarCheck,PhoneCall,Euro,ArrowRight } from "lucide-react"
import Link from "next/link"
import { Card,CardHeader,CardTitle,CardDescription,CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"
import type { PracticeSummary } from "@/lib/types"

export default function PerformancePage(){
  const {tenantId,demoEnabled,refreshTick}=usePractice()
  const demo=usePracticeData()
  const [from,setFrom]=useState(()=>new Date(Date.now()-29*86400000).toISOString().slice(0,10))
  const [to,setTo]=useState(()=>new Date().toISOString().slice(0,10))
  const [summary,setSummary]=useState<PracticeSummary|null>(null)
  const [error,setError]=useState("")
  const [loadedKey,setLoadedKey]=useState("")
  const [retry,setRetry]=useState(0)
  const requestKey=JSON.stringify([tenantId,from,to,demoEnabled,refreshTick,retry])
  const loading=loadedKey!==requestKey
  useEffect(()=>{
    if(!tenantId||demoEnabled)return
    const controller=new AbortController()
    fetch(`/api/tenants/${encodeURIComponent(tenantId)}/summary?${new URLSearchParams({from,to})}`,{signal:controller.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);return data}).then(data=>{if(!controller.signal.aborted){setSummary(data);setError("")}}).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoadedKey(requestKey)})
    return()=>controller.abort()
  },[tenantId,from,to,demoEnabled,refreshTick,retry,requestKey])
  const data=demoEnabled?demo.summary:summary
  const series=data?.series??[]
  const currency=(n:number)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n)
  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-3xl font-semibold tracking-tight">Rapports</h1><p className="mt-2 text-sm text-muted-foreground">Mesurez l’activité sur une période.</p></div><div className="flex flex-wrap items-end gap-2"><label className="space-y-1 text-sm">Du<Input type="date" value={from} disabled={demoEnabled} onChange={e=>setFrom(e.target.value)} /></label><label className="space-y-1 text-sm">Au<Input type="date" value={to} disabled={demoEnabled} onChange={e=>setTo(e.target.value)} /></label></div></header>
    {demoEnabled?<p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">Démonstration sur 14 jours. Les filtres de période sont disponibles avec vos données réelles.</p>:null}
    {error&&!demoEnabled?<div role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm">{error}<Button variant="outline" size="sm" className="ml-3" onClick={()=>setRetry(n=>n+1)}>Réessayer</Button></div>:null}
    {(demoEnabled?demo.loading:loading)?<Skeleton className="h-28" />:error&&!demoEnabled?null:<>
      <div className="grid gap-4 md:grid-cols-3">{[{label:"Appels traités",value:data?.calls??0,icon:PhoneCall},{label:"Rendez-vous enregistrés",value:data?.bookings??0,icon:CalendarCheck},{label:"Valeur estimée",value:currency(data?.estimatedRevenue??0),icon:Euro}].map(item=><Card key={item.label}><CardHeader className="flex flex-row items-center justify-between"><CardDescription>{item.label}</CardDescription><item.icon className="size-4 text-primary" /></CardHeader><CardContent><p className="font-heading text-3xl font-semibold tabular-nums">{item.value}</p></CardContent></Card>)}</div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]"><Card><CardHeader><CardTitle>Rendez-vous enregistrés par jour</CardTitle><CardDescription>Date de création de la demande, pas date de consultation.</CardDescription></CardHeader><CardContent><div className="h-80">{series.length?<ResponsiveContainer width="100%" height="100%"><AreaChart data={series} margin={{left:-20,right:10}}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5).replace('-','/')} tick={{fontSize:12}} minTickGap={30} /><YAxis allowDecimals={false} tick={{fontSize:12}} /><Tooltip contentStyle={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8}} /><Area dataKey="bookings" name="Rendez-vous" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} type="linear" /></AreaChart></ResponsiveContainer>:<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Aucune activité sur cette période.</div>}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Pour votre équipe</CardTitle><CardDescription>Demandes ouvertes, toutes périodes confondues.</CardDescription></CardHeader><CardContent className="space-y-5"><p className="font-heading text-4xl font-semibold">{data?.openTasks??0}<span className="ml-2 text-sm font-normal text-muted-foreground">à traiter</span></p><p className="text-sm text-muted-foreground">{data?.urgentTasks??0} demande(s) marquée(s) urgente(s)</p><Link href="/inbox" className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium text-primary">Consulter la boîte de réception<ArrowRight className="size-4" /></Link></CardContent></Card></div>
      <details className="border-t py-4"><summary className="cursor-pointer text-sm text-muted-foreground">Méthode de calcul et limites des indicateurs</summary><div className="mt-4 grid gap-5 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2"><p>La valeur estimée correspond aux rendez-vous enregistrés × la valeur moyenne renseignée dans les réglages. Elle ne mesure ni les soins réalisés ni les paiements reçus.</p><p>La conversion n’est pas disponible pour les réservations historiques sans lien individuel avec un appel.</p></div></details>
    </>}
  </div>
}
