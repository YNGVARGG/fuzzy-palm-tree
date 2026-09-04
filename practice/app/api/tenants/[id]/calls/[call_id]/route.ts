import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { CALLS_DIR } from "@/lib/server-data"

const SAFE_ID = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; call_id: string }> }) {
  const { id, call_id } = await params
  if (!SAFE_ID.test(call_id)) return NextResponse.json({ error: "bad call id" }, { status: 400 })
  const p = path.join(CALLS_DIR, id, call_id, "transcript.json")
  if (!fs.existsSync(p)) return NextResponse.json({ error: "no transcript" }, { status: 404 })
  try {
    const messages = JSON.parse(fs.readFileSync(p, "utf8"))
    return NextResponse.json({ messages })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
