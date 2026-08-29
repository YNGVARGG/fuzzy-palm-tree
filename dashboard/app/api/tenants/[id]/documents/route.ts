import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { AGENT_DIR, NotFoundError, TENANTS_DIR, readTenant } from "@/lib/server-data"

const DOC_EXTS = [".txt", ".md"]

function docsDir(id: string) {
  return path.join(TENANTS_DIR, id, "docs")
}

function indexInfo(id: string) {
  const p = path.join(TENANTS_DIR, id, "faq_index.json")
  if (!fs.existsSync(p)) return { chunks: 0 }
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"))
    return { chunks: Array.isArray(j.chunks) ? j.chunks.length : 0 }
  } catch {
    return { chunks: 0 }
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    readTenant(id)
    const dir = docsDir(id)
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir, { withFileTypes: true })
          .filter((d) => d.isFile() && DOC_EXTS.includes(path.extname(d.name).toLowerCase()))
          .map((d) => ({ name: d.name, size: fs.statSync(path.join(dir, d.name)).size }))
      : []
    return NextResponse.json({ files, index: indexInfo(id) })
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    readTenant(id)
    const form = await req.formData()
    const files = form.getAll("files") as File[]
    const dir = docsDir(id)
    fs.mkdirSync(dir, { recursive: true })
    const saved: string[] = []
    for (const f of files) {
      const name = path.basename(f.name).replace(/[^\w.\-]/g, "_")
      if (!DOC_EXTS.includes(path.extname(name).toLowerCase())) continue
      fs.writeFileSync(path.join(dir, name), Buffer.from(await f.arrayBuffer()))
      saved.push(name)
    }
    // Reindex (index_docs.py loads agent/.env itself when run with cwd=agent)
    let indexed = -1
    try {
      const py = path.join(AGENT_DIR, ".venv", "Scripts", "python.exe")
      const out = execFileSync(py, ["index_docs.py", id], { cwd: AGENT_DIR, encoding: "utf8", timeout: 120000 })
      const m = out.match(/Indexed (\d+) chunks/)
      indexed = m ? parseInt(m[1], 10) : 0
    } catch {
      indexed = -1
    }
    return NextResponse.json({ saved, indexed })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
