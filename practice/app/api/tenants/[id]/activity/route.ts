import { withAccess } from "@/lib/route-access"
import { NextResponse } from "next/server"
import { getStore, readTenant } from "@/lib/server-data"
import { apiError, parseQuery } from "@/lib/api-query"

async function GETImpl(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    readTenant(id)
    const store=getStore()
    const query=parseQuery(req)
    await store.syncEvents()
    const kind=new URL(req.url).searchParams.get("kind")
    if(kind) return NextResponse.json(store.activity(id,kind,query))
    const bookings=store.activity(id,"bookings",query)
    const messages=store.activity(id,"messages",query)
    return NextResponse.json({...bookings,messages:messages.messages,total_events:bookings.total+messages.total})
  } catch (e) {
    return apiError(e)
  }
}

export const GET = withAccess(GETImpl)
