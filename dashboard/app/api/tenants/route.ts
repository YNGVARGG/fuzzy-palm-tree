import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { TENANTS_DIR } from "@/lib/server-data"

function slugify(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return s || "entreprise"
}

const DEFAULTS = {
  after_hours_note: "Si l'appel a lieu en dehors des heures d'ouverture, propose de prendre rendez-vous le jour ouvrable suivant ou de laisser un message pour être rappelé.",
  booking_slots: "Les rendez-vous durent 60 minutes.",
  callback_promise: "L'équipe rappelle dans un délai d'un jour ouvrable.",
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
    let id = slugify(name)
    let dir = path.join(TENANTS_DIR, id)
    let n = 2
    while (fs.existsSync(dir)) {
      id = slugify(name) + "-" + n
      dir = path.join(TENANTS_DIR, id)
      n++
    }
    fs.mkdirSync(path.join(dir, "docs"), { recursive: true })
    const services = Array.isArray(body.services)
      ? body.services.map((s) => String(s).trim()).filter(Boolean)
      : []
    const faq: Record<string, string> = {}
    if (body.faq && typeof body.faq === "object" && !Array.isArray(body.faq)) {
      for (const [k, v] of Object.entries(body.faq as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim()) faq[k] = v.trim()
      }
    }
    const tenant = {
      id,
      name,
      tagline: typeof body.tagline === "string" ? body.tagline.trim() : "",
      language: body.language === "en" ? "en" : "fr",
      greeting_name: typeof body.greeting_name === "string" && body.greeting_name.trim() ? body.greeting_name.trim() : "Alex",
      phone_numbers: [] as string[],
      services,
      hours: typeof body.hours === "string" ? body.hours.trim() : "",
      after_hours_note: DEFAULTS.after_hours_note,
      booking_slots: DEFAULTS.booking_slots,
      callback_promise: DEFAULTS.callback_promise,
      faq,
    }
    fs.writeFileSync(path.join(dir, "tenant.json"), JSON.stringify(tenant, null, 2) + "\n", "utf8")
    return NextResponse.json({ created: true, id, name: tenant.name })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
