import { auth, authReady } from "@/auth"
import { redirect } from "next/navigation"
import { configuredProviders } from "@/lib/auth-policy"
import { LoginForm } from "@/components/login-form"
export const dynamic = "force-dynamic"
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (authReady() && (await auth())?.access) redirect("/")
  const params = await searchParams
  return <LoginForm key={`${Boolean(params.sent)}:${Boolean(params.error)}:${Boolean(params.retry)}`} providers={authReady() ? configuredProviders() : []} initialSent={params.sent === "1"} initialError={Boolean(params.error)} initialLimited={params.retry === "1"} />
}
