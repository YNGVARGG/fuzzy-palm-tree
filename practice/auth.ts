import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import Resend from "next-auth/providers/resend"
import { emailAdapter, emailAuthStore, validLoginEmail } from "./lib/email-auth"
import { configuredProviders, isAuthProvider, normalizeEmail } from "./lib/auth-policy"
import { resolveMembership, type AuthIdentity } from "./lib/auth-memberships"

export const authReady = () => Boolean(process.env.AUTH_SECRET && configuredProviders().length && (process.env.NODE_ENV !== "production" || process.env.AUTH_URL?.startsWith("https://")))

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: configuredProviders().includes("email") ? emailAdapter : undefined,
  providers: configuredProviders().map(p => p === "email" ? Resend({
    id: "email", name: "Email", apiKey: process.env.AUTH_RESEND_KEY,
    from: process.env.AUTH_EMAIL_FROM, maxAge: 15 * 60,
    normalizeIdentifier(value) {
      const email = validLoginEmail(value)
      if (!email) throw new Error("Invalid email")
      return email
    },
    async sendVerificationRequest({ identifier, url, provider }) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: provider.from, to: [identifier], subject: "Votre lien de connexion Standard IA", text: `Connectez-vous à votre cabinet :\n\n${url}\n\nCe lien personnel est utilisable une seule fois pendant 15 minutes. Si vous n’avez pas demandé ce lien, ignorez cet email.` }),
      })
      if (!response.ok) throw new Error("Email delivery unavailable")
    },
  }) : p === "google" ? Google({ authorization: { params: { prompt: "select_account" } } }) : Apple),
  pages: { signIn: "/login", error: "/login", verifyRequest: "/login?sent=1" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    signIn({ account, profile, user, email }) {
      if (!authReady() || !account || !isAuthProvider(account.provider)) return false
      if (account.provider === "email") {
        const address = validLoginEmail(user.email)
        const allowed = address && resolveMembership({ provider: "email", providerAccountId: address, email: address })
        if (email?.verificationRequest) {
          const withinLimit = address && emailAuthStore().allowRequest(address)
          if (!withinLimit) return "/login?retry=1"
          return allowed ? true : "/api/auth/verify-request?provider=email&type=email"
        }
        return Boolean(allowed)
      }
      const verified = profile?.email_verified === true || String(profile?.email_verified) === "true"
      const identity: AuthIdentity = { provider: account.provider, providerAccountId: account.providerAccountId, email: verified ? normalizeEmail(profile?.email) : null }
      return Boolean(resolveMembership(identity))
    },
    jwt({ token, account, profile, user }) {
      if (account && isAuthProvider(account.provider)) {
        token.identity = { provider: account.provider, providerAccountId: account.providerAccountId, email: account.provider === "email" ? validLoginEmail(user.email) : profile?.email_verified === true || String(profile?.email_verified) === "true" ? normalizeEmail(profile?.email) : null }
      }
      return token
    },
    session({ session, token }) {
      const identity = token.identity as AuthIdentity | undefined
      session.access = identity ? resolveMembership(identity) : null
      return session
    },
    redirect({ url, baseUrl }) {
      return url.startsWith("/") && !url.startsWith("//") ? `${baseUrl}${url}` : new URL(url).origin === baseUrl ? url : baseUrl
    },
  },
})

declare module "next-auth" {
  interface Session { access: { tenantId: string; role: import("./lib/auth-policy").Role } | null }
}
