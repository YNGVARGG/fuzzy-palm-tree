import { withAccess } from "@/lib/route-access"
import { NextResponse } from "next/server"
import { getStore, readTenant } from "@/lib/server-data"
import { apiError, parseQuery } from "@/lib/api-query"

async function GETImpl(req:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const {id}=await params
    const tenant=readTenant(id)
    const query=parseQuery(req)
    query.to ||= new Date().toISOString().slice(0,10)
    query.from ||= new Date(Date.parse(query.to)-29*86400000).toISOString().slice(0,10)
    if(Date.parse(query.to)-Date.parse(query.from)>366*86400000) throw new Error("Date invalide : sélectionnez au maximum un an")
    const store=getStore()
    await Promise.all([store.syncEvents(),store.syncCalls(id)])
    return NextResponse.json({...store.summary(id,Math.max(0,Number(tenant.avg_appointment_value)||0),query),from:query.from,to:query.to})
  } catch(error) {return apiError(error)}
}

export const GET = withAccess(GETImpl)
