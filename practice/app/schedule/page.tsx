"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarCheck, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SchedulePage(){return <Suspense fallback={<p className="p-8">Chargement…</p>}><ScheduleForm /></Suspense>}
function ScheduleForm(){
  const practice=useSearchParams().get("p")??""
  const [tenant,setTenant]=useState<{id:string;name:string;services:string[]}|null>(null)
  const [form,setForm]=useState({name:"",phone:"",service:"",date:"",time:""})
  const [error,setError]=useState("")
  const [done,setDone]=useState("")
  const [busy,setBusy]=useState(false)
  useEffect(()=>{
    const controller=new AbortController()
    setTenant(null)
    if(!practice){setError("Ouvrez le lien fourni par votre cabinet pour faire une demande.");return}
    fetch(`/api/public/practices/${encodeURIComponent(practice)}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();return r.json()}).then(setTenant).catch(()=>{if(!controller.signal.aborted)setError("Le formulaire de ce cabinet est indisponible.")})
    return ()=>controller.abort()
  },[practice])
  async function submit(e:React.FormEvent){
    e.preventDefault();if(!tenant||busy)return;setBusy(true);setError("")
    try{const r=await fetch("/api/schedule",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,practice:tenant.id})});const d=await r.json();if(!r.ok)throw new Error(d.error);setDone(d.reference)}catch(e){setError(e instanceof Error?e.message:"Réessayez.")}finally{setBusy(false)}
  }
  return <div className="workspace-shell flex min-h-svh items-center justify-center bg-background p-6"><div className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-sm"><PhoneCall className="mb-5 size-7 text-primary"/><h1 className="font-heading text-2xl font-semibold">{tenant?.name??"Votre demande de rendez-vous"}</h1><p className="mt-3 text-sm text-muted-foreground">Le cabinet vérifiera le créneau et vous contactera pour confirmer. Ce formulaire ne réserve pas directement dans l’agenda.</p>{done?<div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5"><CalendarCheck className="mb-2 size-6 text-primary"/><p className="font-semibold">Demande transmise</p><p className="mt-2 text-sm text-muted-foreground">Attendez la confirmation du cabinet avant de vous déplacer.</p><p className="mt-3 break-all text-xs text-muted-foreground">Référence : {done}</p></div>:tenant?<form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm">Nom complet<Input required maxLength={100} autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="block text-sm">Téléphone<Input required type="tel" maxLength={30} autoComplete="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label className="block text-sm">Motif<select required className="mt-1 h-10 w-full rounded-lg border bg-background px-3" value={form.service} onChange={e=>setForm({...form,service:e.target.value})}><option value="">Choisir un motif</option>{tenant.services.map(s=><option key={s}>{s}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">Date souhaitée<Input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label className="text-sm">Heure souhaitée<Input type="time" required value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div><p className="text-xs leading-relaxed text-muted-foreground">Ces informations sont transmises au cabinet pour traiter votre demande. Pour une urgence, contactez directement le cabinet ou les services d’urgence locaux.</p><Button type="submit" disabled={busy} className="w-full">{busy?"Envoi…":"Envoyer ma demande"}</Button></form>:null}{error?<p role="alert" className="mt-5 text-sm text-destructive">{error}</p>:null}</div></div>
}
