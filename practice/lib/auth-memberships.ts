import fs from "node:fs"
import path from "node:path"
import {
  type AuthProvider,
  type Role,
  configuredProviders,
  isAuthProvider,
  isRole,
  isSafeTenantId,
  membershipsFilePath,
  normalizeEmail,
  practiceAgentDir,
} from "./auth-policy.ts"

export type MembershipEntry = {
  email?: string
  provider?: AuthProvider
  providers?: AuthProvider[]
  providerAccountId?: string
  tenantId: string
  role: Role
}

export type AuthIdentity = {
  provider: AuthProvider
  providerAccountId: string
  email: string | null
}

export type ResolvedMembership = {
  tenantId: string
  role: Role
}

type MembershipDocument = { memberships?: unknown }

let warnedPath = ""

function logInvalidMemberships(message: string) {
  const file = membershipsFilePath()
  if (warnedPath === file) return
  warnedPath = file
  console.error(`Practice authentication memberships unavailable: ${message}`)
}

function parseEntry(value: unknown): MembershipEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const tenantId = raw.tenantId
  const role = raw.role
  if (!isSafeTenantId(tenantId) || !isRole(role)) return null

  const email = raw.email === undefined ? undefined : normalizeEmail(raw.email)
  if (raw.email !== undefined && !email) return null
  const provider = raw.provider === undefined ? undefined : isAuthProvider(raw.provider) ? raw.provider : null
  if (provider === null) return null
  const providers = raw.providers === undefined
    ? undefined
    : Array.isArray(raw.providers) && raw.providers.every(isAuthProvider)
      ? [...new Set(raw.providers)]
      : null
  if (providers === null || (provider && providers && !providers.includes(provider))) return null
  const providerAccountId = raw.providerAccountId === undefined ? undefined : String(raw.providerAccountId).trim()
  if (providerAccountId !== undefined && (!providerAccountId || providerAccountId.length > 256)) return null
  if (providerAccountId && !provider) return null
  if (!email && !providerAccountId) return null
  return { email: email || undefined, provider: provider || undefined, providers, providerAccountId, tenantId, role }
}

function readMemberships(): MembershipEntry[] {
  const file = membershipsFilePath()
  if (!fs.existsSync(file)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown
    const values = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as MembershipDocument).memberships
        : null
    if (!Array.isArray(values)) {
      logInvalidMemberships("the file must contain a memberships array")
      return []
    }
    const entries = values.map(parseEntry).filter((entry): entry is MembershipEntry => Boolean(entry))
    if (entries.length !== values.length) logInvalidMemberships("one or more membership entries are invalid")
    return entries
  } catch (error) {
    logInvalidMemberships(error instanceof Error ? error.message : "invalid JSON")
    return []
  }
}

function identityMatches(entry: MembershipEntry, identity: AuthIdentity): boolean {
  if (entry.provider && entry.provider !== identity.provider) return false
  if (entry.providers && !entry.providers.includes(identity.provider)) return false
  if (entry.providerAccountId && entry.providerAccountId !== identity.providerAccountId) return false
  if (entry.email && entry.email !== identity.email) return false
  return Boolean(entry.providerAccountId || entry.email)
}

function tenantExists(tenantId: string): boolean {
  return fs.existsSync(path.join(practiceAgentDir(), "tenants", tenantId, "tenant.json"))
}

/**
 * Resolve exactly one dental business for an OAuth identity.
 * A missing file, malformed entry, unknown tenant, or ambiguous tenant is a deny.
 */
export function resolveMembership(identity: AuthIdentity, env: NodeJS.ProcessEnv = process.env): ResolvedMembership | null {
  if (!identity.providerAccountId || !isAuthProvider(identity.provider)) return null
  if (!configuredProviders(env).includes(identity.provider)) return null
  const matches = readMemberships().filter((entry) => identityMatches(entry, identity))
  const tenantIds = [...new Set(matches.map((entry) => entry.tenantId))]
  if (tenantIds.length !== 1 || !tenantExists(tenantIds[0])) return null
  const role = matches.reduce<Role | null>((best, entry) => {
    if (!best) return entry.role
    const ranks: Record<Role, number> = { viewer: 10, staff: 20, admin: 30, owner: 40 }
    return ranks[entry.role] > ranks[best] ? entry.role : best
  }, null)
  return role ? { tenantId: tenantIds[0], role } : null
}

export function membershipFileLocation(): string {
  return membershipsFilePath()
}
