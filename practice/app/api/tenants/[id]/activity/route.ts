import { NextResponse } from "next/server"
import { NotFoundError, readEvents, readTenant } from "@/lib/server-data"
import type { Activity } from "@/lib/types"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    readTenant(id)
    const events = readEvents().filter((e) => e.tenant === id)
    const bookings = events.filter((e) => e.kind === "appointment_booked")
    const messages = events.filter((e) => e.kind === "message_taken")
    const byDate = (a: { at: string }, b: { at: string }) => b.at.localeCompare(a.at)
    const activity: Activity = {
      total_events: events.length,
      bookings: [...bookings].sort(byDate),
      messages: [...messages].sort(byDate),
    }
    return NextResponse.json(activity)
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
