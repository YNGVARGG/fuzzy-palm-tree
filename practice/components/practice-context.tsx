"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { Tenant, TenantSummary } from "@/lib/types"

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
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [tenantId, setTenantIdState] = useState<string>("")
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [agentUp, setAgentUp] = useState<boolean | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [demoEnabled, setDemoEnabledState] = useState(false)

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((d) => {
        setTenants(d.tenants ?? [])
        if (typeof window !== "undefined" && window.localStorage.getItem("practice-demo") === "1") setDemoEnabledState(true)
        const stored = typeof window !== "undefined" ? window.localStorage.getItem("practice-id") : null
        const first = d.tenants && d.tenants.length > 0 ? d.tenants[0].id : ""
        const picked = d.tenants?.some((x: TenantSummary) => x.id === stored) ? stored : first
        setTenantIdState(picked)
      })
      .catch(() => undefined)
  }, [])

  const refresh = useCallback(() => setRefreshTick((n) => n + 1), [])

  const setDemoEnabled = useCallback((v: boolean) => {
    setDemoEnabledState(v)
    if (typeof window !== "undefined") window.localStorage.setItem("practice-demo", v ? "1" : "0")
  }, [])

  const setTenantId = useCallback((id: string) => {
    setTenantIdState(id)
    if (typeof window !== "undefined") window.localStorage.setItem("practice-id", id)
  }, [])

  useEffect(() => {
    if (!tenantId) return
    fetch("/api/tenants/" + tenantId)
      .then((r) => r.json())
      .then(setTenant)
      .catch(() => undefined)
    fetch("/api/tenants/" + tenantId + "/status")
      .then((r) => r.json())
      .then((d) => setAgentUp(Boolean(d.up)))
      .catch(() => setAgentUp(false))
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