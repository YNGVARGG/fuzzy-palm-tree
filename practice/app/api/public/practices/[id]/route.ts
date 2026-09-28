import { readTenant } from "@/lib/server-data"
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const t = readTenant(id)
    if (t.public_booking_enabled !== true) throw new Error()
    return Response.json({ id, name: t.name, services: t.services }, { headers: { "Cache-Control": "no-store" } })
  } catch { return Response.json({ error: "Ce formulaire est indisponible." }, { status: 404 }) }
}
