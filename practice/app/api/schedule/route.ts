import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { LOG_FILE, readTenant, TENANTS_DIR } from "@/lib/server-data"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const practice = typeof body.practice === "string" ? body.practice : ""
    if (!practice || !fs.existsSync(path.join(TENANTS_DIR, practice, "tenant.json"))) {
      return NextResponse.json({ error: "pratique inconnue" }, { status: 400 })
    }
    const name = String(body.name ?? "").trim()
    const phone = String(body.phone ?? "").trim()
    const service = String(body.service ?? "").trim()
    const date = String(body.date ?? "").trim()
    const time = String(body.time ?? "").trim()
    if (!name || !date || !time) return NextResponse.json({ error: "champs requis manquants" }, { status: 400 })
    const now = Date.now()
    const reference = String(2000 + (now % 5000))
    const event = {
      kind: "appointment_booked",
      at: new Date().toISOString(),
      tenant: practice,
      reference,
      customer_name: name,
      phone: phone || "—",
      service: service || "Consultation",
      date,
      time,
    }
    fs.appendFileSync(LOG_FILE, JSON.stringify(event) + "\n", "utf8")
    return NextResponse.json({ created: true, reference, date, time })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
