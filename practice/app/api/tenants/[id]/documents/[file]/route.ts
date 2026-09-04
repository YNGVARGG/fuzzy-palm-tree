import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { AGENT_DIR, TENANTS_DIR } from "@/lib/server-data"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params
  const name = path.basename(decodeURIComponent(file))
  const p = path.join(TENANTS_DIR, id, "docs", name)
  if (!fs.existsSync(p)) return NextResponse.json({ error: "not found" }, { status: 404 })
  return new NextResponse(fs.readFileSync(p, "utf8"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params
  const name = path.basename(decodeURIComponent(file))
  const p = path.join(TENANTS_DIR, id, "docs", name)
  if (!fs.existsSync(p)) return NextResponse.json({ error: "not found" }, { status: 404 })
  fs.rmSync(p, { force: true })
  let indexed = -1
  try {
    const py = path.join(AGENT_DIR, ".venv", "Scripts", "python.exe")
    const out = execFileSync(py, ["index_docs.py", id], { cwd: AGENT_DIR, encoding: "utf8", timeout: 120000 })
    const m = out.match(/Indexed (\d+) chunks/)
    indexed = m ? parseInt(m[1], 10) : 0
  } catch {
    indexed = -1
  }
  return NextResponse.json({ deleted: true, indexed })
}
