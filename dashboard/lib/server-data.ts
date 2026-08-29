import fs from "node:fs"
import path from "node:path"
import type { ActivityEvent } from "@/lib/types"

export const AGENT_DIR = path.join(process.cwd(), "..", "agent")
export const TENANTS_DIR = path.join(AGENT_DIR, "tenants")
export const LOG_FILE = path.join(AGENT_DIR, "call-activity.jsonl")
export const AGENT_URL = process.env.AGENT_URL ?? "http://127.0.0.1:7860"
export const CALLS_DIR = path.join(AGENT_DIR, "calls")

export class NotFoundError extends Error {}

export function readTenant(id: string): Record<string, unknown> {
  const p = path.join(TENANTS_DIR, id, "tenant.json")
  if (!fs.existsSync(p)) throw new NotFoundError("Tenant inconnu : " + id)
  return JSON.parse(fs.readFileSync(p, "utf8"))
}

export function saveTenant(id: string, data: Record<string, unknown>): void {
  const p = path.join(TENANTS_DIR, id, "tenant.json")
  const tmp = p + ".tmp"
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8")
  fs.renameSync(tmp, p)
}

export type CallInfo = {
  id: string
  summary: string
  message_count: number
  has_audio: boolean
}

export function listCalls(tenantId: string): CallInfo[] {
  const dir = path.join(CALLS_DIR, tenantId)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const base = path.join(dir, d.name)
      let summary = ""
      const sPath = path.join(base, "summary.txt")
      if (fs.existsSync(sPath)) summary = fs.readFileSync(sPath, "utf8").trim()
      let message_count = 0
      const tPath = path.join(base, "transcript.json")
      if (fs.existsSync(tPath)) {
        try {
          message_count = (JSON.parse(fs.readFileSync(tPath, "utf8")) as unknown[]).length
        } catch {
          message_count = 0
        }
      }
      return {
        id: d.name,
        summary,
        message_count,
        has_audio: fs.existsSync(path.join(base, "audio.wav")),
      }
    })
    .sort((a, b) => b.id.localeCompare(a.id))
}

export function readEvents(): ActivityEvent[] {
  if (!fs.existsSync(LOG_FILE)) return []
  const out: ActivityEvent[] = []
  for (const line of fs.readFileSync(LOG_FILE, "utf8").split("\n")) {
    const t = line.trim()
    if (!t) continue
    try { out.push(JSON.parse(t)) } catch { /* skip malformed */ }
  }
  return out
}
