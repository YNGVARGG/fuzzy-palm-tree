import fs from "node:fs"
import path from "node:path"
import type { ActivityEvent } from "@/lib/types"

export const AGENT_DIR = path.join(process.cwd(), "..", "agent")
export const TENANTS_DIR = path.join(AGENT_DIR, "tenants")
export const LOG_FILE = path.join(AGENT_DIR, "call-activity.jsonl")
export const AGENT_URL = process.env.AGENT_URL ?? "http://127.0.0.1:7860"

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
