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
  type?: string
  patient?: string
  recording_refused?: boolean
}

export function listCalls(tenantId: string, limit = 200): CallInfo[] {
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
      let type: string | undefined
      let patient: string | undefined
      let recording_refused: boolean | undefined
      const mPath = path.join(base, "meta.json")
      if (fs.existsSync(mPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(mPath, "utf8"))
          type = meta.type
          patient = meta.patient
          recording_refused = meta.recording_refused
        } catch {
          /* ignore */
        }
      }
      return {
        id: d.name,
        summary,
        message_count,
        has_audio: fs.existsSync(path.join(base, "audio.wav")),
        type,
        patient,
        recording_refused,
      }
    })
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, limit)
}

let _cache: { mtimeMs: number; size: number; events: ActivityEvent[] } | null = null

export function readEvents(): ActivityEvent[] {
  if (!fs.existsSync(LOG_FILE)) return []
  const stat = fs.statSync(LOG_FILE)
  if (_cache && _cache.mtimeMs === stat.mtimeMs && _cache.size === stat.size) {
    return _cache.events
  }
  const out: ActivityEvent[] = []
  for (const line of fs.readFileSync(LOG_FILE, "utf8").split("\n")) {
    const t = line.trim()
    if (!t) continue
    try { out.push(JSON.parse(t)) } catch { /* skip malformed */ }
  }
  _cache = { mtimeMs: stat.mtimeMs, size: stat.size, events: out }
  return out
}

export function purgeCallDirs(tenantId: string, olderThanDays: number): number {
  const dir = path.join(CALLS_DIR, tenantId)
  if (!fs.existsSync(dir)) return 0
  const cutoff = Date.now() - olderThanDays * 86400000
  let removed = 0
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const m = d.name.match(/^(\d{4})-(\d{2})-(\d{2})_/)
    if (!m) continue
    const ts = Date.parse(m[1] + "-" + m[2] + "-" + m[3] + "T00:00:00Z")
    if (!isNaN(ts) && ts < cutoff) {
      fs.rmSync(path.join(dir, d.name), { recursive: true, force: true })
      removed++
    }
  }
  return removed
}

export function removeTenantData(tenantId: string): void {
  const tenantDir = path.join(TENANTS_DIR, tenantId)
  if (fs.existsSync(tenantDir)) fs.rmSync(tenantDir, { recursive: true, force: true })
  const callsDir = path.join(CALLS_DIR, tenantId)
  if (fs.existsSync(callsDir)) fs.rmSync(callsDir, { recursive: true, force: true })
  // strip this tenant's events from the activity log
  if (fs.existsSync(LOG_FILE)) {
    const kept = fs
      .readFileSync(LOG_FILE, "utf8")
      .split("\n")
      .filter((line) => {
        const t = line.trim()
        if (!t) return false
        try {
          const e = JSON.parse(t)
          return e.tenant !== tenantId
        } catch {
          return true
        }
      })
      .join("\n")
    fs.writeFileSync(LOG_FILE, kept, "utf8")
  }
  _cache = null
}