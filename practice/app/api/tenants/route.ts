import { auth } from "@/auth"
import { withAccess } from "@/lib/route-access"
import { readTenant } from "@/lib/server-data"
export const GET = withAccess(async () => {
  const session = await auth()
  const id = session!.access!.tenantId
  const t = readTenant(id)
  return Response.json({ tenants: [{ id, name: String(t.name), language: String(t.language ?? "fr") }], role: session!.access!.role })
})
