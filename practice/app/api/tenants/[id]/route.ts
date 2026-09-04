import { NextResponse } from "next/server"
import { NotFoundError, readTenant, saveTenant } from "@/lib/server-data"

const TEXT_FIELDS = [
  "name",
  "tagline",
  "greeting_name",
  "language",
  "hours",
  "after_hours_note",
  "booking_slots",
  "callback_promise",
] as const

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(readTenant(id))
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenant = readTenant(id)
    const body = (await req.json()) as Record<string, unknown>
    for (const key of TEXT_FIELDS) {
      const v = body[key]
      if (typeof v === "string" && v.trim() !== "") tenant[key] = v.trim()
    }
    if (Array.isArray(body.services)) {
      tenant.services = body.services.map((s) => String(s).trim()).filter(Boolean)
    }
    for (const key of ["avg_appointment_value", "missed_calls_per_month"]) {
      const v = body[key]
      if (typeof v === "number" && isFinite(v)) tenant[key] = v
    }
    if (body.faq && typeof body.faq === "object" && !Array.isArray(body.faq)) {
      const faq: Record<string, string> = {}
      for (const [k, v] of Object.entries(body.faq as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim()) faq[k] = v.trim()
      }
      tenant.faq = faq
    }
    saveTenant(id, tenant)
    return NextResponse.json({ saved: true, tenant })
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}