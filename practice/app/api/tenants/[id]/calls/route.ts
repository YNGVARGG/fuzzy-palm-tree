import { NextResponse } from "next/server"
import { listCalls, NotFoundError, readTenant } from "@/lib/server-data"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    readTenant(id)
    return NextResponse.json({ calls: listCalls(id) })
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
