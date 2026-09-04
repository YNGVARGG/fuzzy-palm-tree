import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { CALLS_DIR, readEvents, readTenant, TENANTS_DIR } from "@/lib/server-data"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenant = readTenant(id)
    const events = readEvents().filter((e) => e.tenant === id)
    const callsDir = path.join(CALLS_DIR, id)
    const calls: unknown[] = []
    if (fs.existsSync(callsDir)) {
      for (const d of fs.readdirSync(callsDir, { withFileTypes: true })) {
        if (!d.isDirectory()) continue
        const base = path.join(callsDir, d.name)
        const read = (f: string) => {
          const p = path.join(base, f)
          if (!fs.existsSync(p)) return null
          try { return JSON.parse(fs.readFileSync(p, "utf8")) } catch { return null }
        }
        calls.push({
          id: d.name,
          transcript: read("transcript.json"),
          summary: fs.existsSync(path.join(base, "summary.txt")) ? fs.readFileSync(path.join(base, "summary.txt"), "utf8") : null,
          meta: read("meta.json"),
          has_audio: fs.existsSync(path.join(base, "audio.wav")),
        })
      }
    }
    const bundle = {
      exported_at: new Date().toISOString(),
      tenant,
      activity: events,
      calls,
    }
    return new NextResponse(JSON.stringify(bundle, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": "attachment; filename=export-" + id + ".json"
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
