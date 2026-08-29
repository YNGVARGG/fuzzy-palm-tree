import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { TENANTS_DIR } from "@/lib/server-data"
import type { TenantSummary } from "@/lib/types"

export async function GET() {
  try {
    const dirs = fs.readdirSync(TENANTS_DIR, { withFileTypes: true })
    const tenants: TenantSummary[] = dirs
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(TENANTS_DIR, d.name, "tenant.json")))
      .map((d) => {
        const t = JSON.parse(fs.readFileSync(path.join(TENANTS_DIR, d.name, "tenant.json"), "utf8"))
        return { id: d.name, name: String(t.name ?? d.name), language: String(t.language ?? "en") }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ tenants })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
