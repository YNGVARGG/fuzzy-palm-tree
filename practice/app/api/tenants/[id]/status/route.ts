import { NextResponse } from "next/server"
import { AGENT_URL, NotFoundError, readTenant } from "@/lib/server-data"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    readTenant(id)
    let up = false
    try {
      const r = await fetch(AGENT_URL, { signal: AbortSignal.timeout(2000) })
      up = r.ok
    } catch {
      up = false
    }
    return NextResponse.json({ up, url: AGENT_URL })
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
