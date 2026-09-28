import { withAccess } from "@/lib/route-access"
import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { CALLS_DIR, readTenant } from "@/lib/server-data"

const SAFE_ID = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}(?:_[a-f0-9]{8})?$/

async function GETImpl(_req: Request, { params }: { params: Promise<{ id: string; call_id: string }> }) {
  const { id, call_id } = await params
  try { readTenant(id) } catch { return NextResponse.json({ error: "Cabinet introuvable" }, { status: 404 }) }
  if (!SAFE_ID.test(call_id)) return NextResponse.json({ error: "bad call id" }, { status: 400 })
  const p = path.join(CALLS_DIR, id, call_id, "audio.wav")
  if (!fs.existsSync(p)) return NextResponse.json({ error: "no audio" }, { status: 404 })
  return new NextResponse(fs.readFileSync(p), {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
  })
}

export const GET = withAccess(GETImpl)
