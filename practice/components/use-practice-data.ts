"use client"

import { useEffect, useMemo, useState } from "react"
import { usePractice } from "@/components/practice-context"
import { demoBookings, demoCalls, demoMessages } from "@/lib/demo"
import type { ActivityEvent, PracticeSummary } from "@/lib/types"

export type CallItem = {
  id: string; summary: string; message_count: number; has_audio: boolean
  messages?: { role: string; content: string }[]
  type?: string; patient?: string; recording_refused?: boolean
}
export type PracticeData = {
  bookings: ActivityEvent[]; messages: ActivityEvent[]; calls: CallItem[]
  loading: boolean; demo: boolean; isEmpty: boolean; error: string | null
  summary: PracticeSummary | null
}
type Loaded = {tenantId:string;bookings:ActivityEvent[];messages:ActivityEvent[];calls:CallItem[];summary:PracticeSummary}

export function usePracticeData(): PracticeData {
  const {tenant,tenantId,refreshTick,demoEnabled}=usePractice()
  const [real,setReal]=useState<Loaded|null>(null)
  const [error,setError]=useState<{tenantId:string;message:string}|null>(null)
  useEffect(()=>{
    if(!tenantId || demoEnabled) return
    const controller=new AbortController()
    const read=async(suffix:string)=>{
      const r=await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/${suffix}`,{signal:controller.signal})
      if(!r.ok) throw new Error("Impossible de charger les données. Réessayez.")
      return r.json()
    }
    Promise.all([read("activity?limit=25"),read("calls?limit=25"),read("summary")]).then(([a,c,s])=>{
      if(controller.signal.aborted) return
      setReal({tenantId,bookings:a.bookings,messages:a.messages,calls:c.calls,summary:s})
      setError(null)
    }).catch(e=>{if(!controller.signal.aborted) setError({tenantId,message:e.message})})
    return ()=>controller.abort()
  },[tenantId,refreshTick,demoEnabled])

  return useMemo(()=>{
    if(demoEnabled && tenant) {
      const bookings:ActivityEvent[]=demoBookings(tenantId,tenant).map((b)=>({...b,kind:"appointment_booked"}))
      const messages:ActivityEvent[]=demoMessages(tenantId,tenant).map((m,i)=>({...m,id:`demo-task-${i}`,kind:"message_taken",status:"open",owner:"",priority:"normal",due_at:"",notes:"",version:0}))
      const calls:CallItem[]=demoCalls(tenantId,tenant).map(c=>({...c,id:"demo-"+c.id,type:c.kind,patient:c.summary.split(" a ")[0]}))
      const daily=new Map<string,number>()
      for(const b of bookings){const date=b.at.slice(0,10);daily.set(date,(daily.get(date)||0)+1)}
      const summary:PracticeSummary={calls:calls.length,bookings:bookings.length,openTasks:messages.length,urgentTasks:0,estimatedRevenue:bookings.length*(tenant.avg_appointment_value||0),bookingCalls:null,conversion:null,series:Array.from(daily,([date,bookings])=>({date,bookings})).sort((a,b)=>a.date.localeCompare(b.date)),recentCalls:calls.slice(0,5),pendingTasks:messages.slice(0,5)}
      return {bookings,messages,calls,summary,loading:false,demo:true,isEmpty:false,error:null}
    }
    const current=real?.tenantId===tenantId?real:null
    const message=error?.tenantId===tenantId?error.message:null
    return {bookings:current?.bookings??[],messages:current?.messages??[],calls:current?.calls??[],summary:current?.summary??null,loading:!current&&!message,demo:false,isEmpty:!!current&&current.summary.calls===0&&current.summary.bookings===0&&current.summary.openTasks===0,error:message}
  },[real,error,tenant,tenantId,demoEnabled])
}
