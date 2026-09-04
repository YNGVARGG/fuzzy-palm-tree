import { NextResponse } from "next/server"
import { listCalls, NotFoundError, purgeCallDirs, readTenant } from "@/lib/server-data"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    readTenant(id)
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10) || 200, 500)
    return NextResponse.json({ calls: listCalls(id, limit) })
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
