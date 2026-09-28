import { NextResponse, type NextRequest } from "next/server"
import { auth, authReady } from "./auth"

export async function proxy(req: NextRequest) {
  const p = req.nextUrl.pathname
  // APIs enforce their own authorization too. No extension-based exemptions.
  if (p.startsWith("/api/") || p === "/login" || p === "/schedule" || p === "/favicon.ico" || p === "/standard-bird.png" || p.startsWith("/_next/")) return NextResponse.next()
  const session = authReady() ? await auth() : null
  if (!session?.access) return NextResponse.redirect(new URL("/login", req.url))
  const response = NextResponse.next()
  response.headers.set("Cache-Control", "private, no-store")
  return response
}
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] }
