import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { CALLS_DIR } from "@/lib/server-data"

const SAFE_ID = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; call_id: string }> }) {
  const { id, call_id } = await params
  if (!SAFE_ID.test(call_id)) return NextResponse.json({ error: "bad call id" }, { status: 400 })
  const dir = path.join(CALLS_DIR, id, call_id)
  if (!fs.existsSync(dir)) return NextResponse.json({ error: "not found" }, { status: 404 })
  const readText = (f: string) => {
    const p = path.join(dir, f)
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null
  }
  const readJson = (f: string) => {
    const t = readText(f)
    if (!t) return null
    try { return JSON.parse(t) } catch { return null }
  }
  return NextResponse.json({
    id: call_id,
    messages: readJson("transcript.json"),
    summary: readText("summary.txt"),
    meta: readJson("meta.json"),
    has_audio: fs.existsSync(path.join(dir, "audio.wav")),
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; call_id: string }> }) {
  const { id, call_id } = await params
  if (!SAFE_ID.test(call_id)) return NextResponse.json({ error: "bad call id" }, { status: 400 })
  const dir = path.join(CALLS_DIR, id, call_id)
  if (!fs.existsSync(dir)) return NextResponse.json({ error: "not found" }, { status: 404 })
  fs.rmSync(dir, { recursive: true, force: true })
  return NextResponse.json({ deleted: true })
}
