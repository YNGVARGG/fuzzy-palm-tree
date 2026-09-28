import path from "node:path"

export type AuthProvider = "google" | "apple" | "email"
export type Role = "owner" | "admin" | "staff" | "viewer"

export const ROLE_RANK: Record<Role, number> = {
  viewer: 10,
  staff: 20,
  admin: 30,
  owner: 40,
}

export const ALL_ROLES: readonly Role[] = ["owner", "admin", "staff", "viewer"]
export const AUTH_PROVIDERS: readonly AuthProvider[] = ["email", "google", "apple"]

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ALL_ROLES.includes(value as Role)
}

export function roleAtLeast(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required]
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  return email && email.length <= 320 ? email : null
}

export function isAuthProvider(value: unknown): value is AuthProvider {
  return typeof value === "string" && AUTH_PROVIDERS.includes(value as AuthProvider)
}

export function isSafeTenantId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value)
}

export function practiceAgentDir(): string {
  return process.env.PRACTICE_AGENT_DIR || path.join(process.cwd(), "..", "agent")
}

export function membershipsFilePath(): string {
  return process.env.PRACTICE_AUTH_MEMBERSHIPS_FILE || path.join(practiceAgentDir(), "auth-memberships.json")
}

export function isConfiguredProvider(provider: AuthProvider, env: NodeJS.ProcessEnv = process.env): boolean {
  if (provider === "email") return Boolean(env.AUTH_RESEND_KEY && env.AUTH_EMAIL_FROM)
  if (provider === "google") return Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET)
  return Boolean(env.AUTH_APPLE_ID && env.AUTH_APPLE_SECRET)
}

export function configuredProviders(env: NodeJS.ProcessEnv = process.env): AuthProvider[] {
  if (isConfiguredProvider("email", env)) return ["email"]
  return AUTH_PROVIDERS.filter((provider) => isConfiguredProvider(provider, env))
}

export function isPublicPracticeLookupPath(pathname: string, method: string): boolean {
  return method === "GET" && /^\/api\/public\/practices\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(pathname)
}

export function isPublicScheduleRequest(pathname: string, method: string): boolean {
  return pathname === "/api/schedule" && method === "POST"
}

export function isMutationMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())
}

function configuredOrigin(env: NodeJS.ProcessEnv): string | null {
  const raw = env.AUTH_URL || env.NEXTAUTH_URL || env.APP_ORIGIN
  if (!raw) return null
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}

function requestOrigin(request: Request, env: NodeJS.ProcessEnv): string | null {
  const configured = configuredOrigin(env)
  if (configured) return configured

  if (env.NODE_ENV === "production") return null
  try {
    return new URL(request.url).origin
  } catch {
    return null
  }
}

export function isTrustedMutationOrigin(request: Request, env: NodeJS.ProcessEnv = process.env): boolean {
  const expected = requestOrigin(request, env)
  if (!expected) return false

  const supplied = request.headers.get("origin") || request.headers.get("referer")
  if (!supplied || supplied === "null") return false
  let actual: string
  try {
    actual = new URL(supplied).origin
  } catch {
    return false
  }
  if (actual === expected) return true

  const allowlisted = (env.AUTH_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .flatMap((value) => {
      try {
        return [new URL(value).origin]
      } catch {
        return []
      }
    })
  return allowlisted.includes(actual)
}
