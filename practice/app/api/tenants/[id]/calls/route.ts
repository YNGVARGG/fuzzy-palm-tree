import { withAccess } from "@/lib/route-access"
import { NextResponse } from "next/server"
import { getStore, NotFoundError, purgeCallDirs, readTenant } from "@/lib/server-data"
import { apiError, parseQuery } from "@/lib/api-query"

async function GETImpl(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    readTenant(id)
    const query=parseQuery(req)
    const store=getStore()
    await store.syncCalls(id)
    return NextResponse.json(store.calls(id,query))
  } catch (e) {
    return apiError(e)
  }
}

async function DELETEImpl(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    readTenant(id)
    const url = new URL(req.url)
    const daysParam = url.searchParams.get("days")
    const all = url.searchParams.get("all") === "true"
    if (all) {
      purgeCallDirs(id, 0)
      return NextResponse.json({ deleted: true, scope: "all-calls" })
    }
    const days = parseInt(daysParam ?? "30", 10)
    const removed = isFinite(days) && days > 0 ? purgeCallDirs(id, days) : 0
    return NextResponse.json({ deleted: true, removed, scope: "older-than-" + days + "-days" })
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export const GET = withAccess(GETImpl)

export const DELETE = withAccess(DELETEImpl)
