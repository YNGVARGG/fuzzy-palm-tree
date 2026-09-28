import { auth, authReady } from "@/auth"
import { isMutationMethod, isTrustedMutationOrigin, roleAtLeast, type Role } from "./auth-policy"

export async function accessError(req: Request): Promise<Response | null> {
  if (!authReady()) return Response.json({ error: "Connexion requise." }, { status: 401 })
  const session = await auth()
  if (!session?.access) return Response.json({ error: "Connexion requise." }, { status: 401 })
  const pathname = new URL(req.url).pathname
  const match = pathname.match(/^\/api\/tenants\/([^/]+)/)
  if (match && decodeURIComponent(match[1]) !== session.access.tenantId) return Response.json({ error: "Accès refusé." }, { status: 403 })
  const mutation = isMutationMethod(req.method)
  const required: Role = req.method === "DELETE" && /^\/api\/tenants\/[^/]+$/.test(pathname) ? "owner"
    : pathname.endsWith("/export") || pathname.endsWith("/bookings-export") || pathname === "/api/config/calendar" || (mutation && !pathname.endsWith("/tasks")) ? "admin"
    : mutation ? "staff" : "viewer"
  if (!roleAtLeast(session.access.role, required)) return Response.json({ error: "Droits insuffisants." }, { status: 403 })
  if (mutation && !isTrustedMutationOrigin(req)) return Response.json({ error: "Origine refusée." }, { status: 403 })
  return null
}

export function withAccess<C>(handler: (req: Request, context: C) => Promise<Response>) {
  return async (req: Request, context: C) => {
    const denied = await accessError(req)
    const response = denied ?? await handler(req, context)
    response.headers.set("Cache-Control", "private, no-store")
    response.headers.set("X-Content-Type-Options", "nosniff")
    return response
  }
}
