import { withAccess } from "@/lib/route-access"
import { NextResponse } from "next/server"
import { getStore, readTenant } from "@/lib/server-data"
import { apiError } from "@/lib/api-query"

async function POSTImpl(req:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const {id}=await params
    readTenant(id)
    const input=await req.json()
    if(!input || typeof input!=="object" || Array.isArray(input)) throw new Error("Champ invalide")
    const store=getStore()
    await store.syncEvents()
    return NextResponse.json({task:store.updateTask(id,input)})
  } catch(error) {return apiError(error)}
}

export const POST = withAccess(POSTImpl)
