"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { Tenant, TenantSummary } from "@/lib/types"
import { usePathname } from "next/navigation"

type PracticeCtx = {
  tenants: TenantSummary[]
  tenantId: string
  tenant: Tenant | null
  setTenantId: (id: string) => void
  agentUp: boolean | null
  refreshTick: number
  refresh: () => void
  demoEnabled: boolean
  setDemoEnabled: (v: boolean) => void
}

const Ctx = createContext<PracticeCtx | null>(null)

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [tenantId, setTenantIdState] = useState<string>("")
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [agentUp, setAgentUp] = useState<boolean | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [demoEnabled, setDemoEnabledState] = useState(false)

  useEffect(() => {
    if (pathname === "/login" || pathname === "/schedule") return
    const controller = new AbortController()
    fetch("/api/tenants", { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("Chargement impossible"); return r.json() })
      .then((d) => {
        if (controller.signal.aborted) return
        setTenants(d.tenants ?? [])
        if (typeof window !== "undefined" && window.localStorage.getItem("practice-demo") === "1") setDemoEnabledState(true)
        const stored = typeof window !== "undefined" ? window.localStorage.getItem("practice-id") : null
        const first = d.tenants && d.tenants.length > 0 ? d.tenants[0].id : ""
        const picked = d.tenants?.some((x: TenantSummary) => x.id === stored) ? stored : first
        setTenantIdState(picked)
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [pathname === "/login", pathname === "/schedule"])

  const refresh = useCallback(() => setRefreshTick((n) => n + 1), [])

  const setDemoEnabled = useCallback((v: boolean) => {
    setDemoEnabledState(v)
    if (typeof window !== "undefined") window.localStorage.setItem("practice-demo", v ? "1" : "0")
  }, [])

  const setTenantId = useCallback((id: string) => {
    setTenant(null)
    setAgentUp(null)
    setTenantIdState(id)
    if (typeof window !== "undefined") window.localStorage.setItem("practice-id", id)
  }, [])

  useEffect(() => {
    if (!tenantId) return
    const controller = new AbortController()
    fetch("/api/tenants/" + tenantId, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("Chargement impossible"); return r.json() })
      .then((data) => { if (!controller.signal.aborted) setTenant(data) })
      .catch(() => undefined)
    fetch("/api/tenants/" + tenantId + "/status", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => { if (!controller.signal.aborted) setAgentUp(Boolean(d.up)) })
      .catch(() => { if (!controller.signal.aborted) setAgentUp(false) })
    return () => controller.abort()
  }, [tenantId, refreshTick])

  return (
    <Ctx.Provider value={{ tenants, tenantId, tenant, setTenantId, agentUp, refreshTick, refresh, demoEnabled, setDemoEnabled }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePractice() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("usePractice must be used within PracticeProvider")
  return ctx
}
