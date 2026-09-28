"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { usePractice } from "@/components/practice-context"
import { demoBookings, demoCalls, demoMessages, type DemoCall, type DemoBooking } from "@/lib/demo"

export type ConversationMessage = { role?: string; content?: unknown }

export type OperationalCall = {
  id: string
  summary?: string
  message_count?: number
  has_audio?: boolean
  messages?: ConversationMessage[]
  type?: string
  kind?: string
  patient?: string
  recording_refused?: boolean
  at?: string
  created_at?: string
  [key: string]: unknown
}

export type OperationalEvent = {
  id: string
  kind?: string
  at?: string
  date?: string
  time?: string
  service?: string
  customer_name?: string
  phone?: string
  reference?: string | number
  message_id?: string | number
  message?: string
  status?: "open" | "resolved" | string
  owner?: string
  priority?: "normal" | "urgent" | string
  due_at?: string
  notes?: string
  version?: number
  [key: string]: unknown
}

export type PageState<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  error: string | null
}

export type PageFilters = {
  page?: number
  limit?: number
  q?: string
  from?: string
  to?: string
  type?: string
}

const DEFAULT_LIMIT = 25

export function asPage(value: unknown, fallbackCount = 0): Omit<PageState<never>, "items" | "loading" | "error"> {
  const d = (value ?? {}) as Record<string, unknown>
  const page = numberOr(d.page, 1)
  const pageSize = numberOr(d.pageSize, DEFAULT_LIMIT)
  const total = numberOr(d.total, fallbackCount)
  return {
    total,
    page,
    pageSize,
    totalPages: numberOr(d.totalPages, Math.max(1, Math.ceil(total / Math.max(1, pageSize)))),
  }
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function safeDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== "string" || !value.trim()) return null

  const text = value.trim().replace(/^demo-/, "")
  const callId = /^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})(?:_[a-f0-9]{8})?$/.exec(text)
  const candidate = callId ? `${callId[1]}T${callId[2]}:${callId[3]}:${callId[4]}` : text
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(candidate)
  const parsed = new Date(dateOnly ? `${candidate}T12:00:00` : candidate)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDateTime(value: unknown, withYear = false): string {
  const date = safeDate(value)
  if (!date) return "—"
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    ...(withYear ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(value: unknown): string {
  const date = safeDate(value)
  if (!date) return "—"
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

export function eventId(event: Partial<OperationalEvent>): string {
  return String(event.id ?? event.message_id ?? event.reference ?? `${event.kind ?? "event"}-${event.at ?? "unknown"}`)
}

function mapCall(call: Record<string, unknown>): OperationalCall {
  return {
    ...call,
    id: String(call.id ?? ""),
    type: typeof call.type === "string" ? call.type : typeof call.kind === "string" ? call.kind : "inconnu",
    summary: typeof call.summary === "string" ? call.summary : "",
    patient: typeof call.patient === "string" ? call.patient : "",
    messages: Array.isArray(call.messages) ? (call.messages as ConversationMessage[]) : undefined,
  }
}

function mapEvent(event: Record<string, unknown>, index: number): OperationalEvent {
  const next = { ...event } as OperationalEvent
  next.id = eventId({ ...event, id: typeof event.id === "string" ? event.id : undefined }) || `event-${index}`
  return next
}

function demoCallItems(tenantId: string, tenant: Parameters<typeof demoCalls>[1]): OperationalCall[] {
  return (demoCalls(tenantId, tenant) as DemoCall[]).map((call) => mapCall({
    ...call,
    id: "demo-" + call.id,
    type: call.kind,
    patient: call.summary.split(" a ")[0] || "Patient",
  }))
}

function demoBookingItems(tenantId: string, tenant: Parameters<typeof demoBookings>[1]): OperationalEvent[] {
  return (demoBookings(tenantId, tenant) as DemoBooking[]).map((booking) => mapEvent({ kind: "appointment_booked", ...booking }, 0))
}

function demoMessageItems(tenantId: string, tenant: Parameters<typeof demoMessages>[1]): OperationalEvent[] {
  return demoMessages(tenantId, tenant).map((message) => mapEvent({
    ...message,
    id: `demo-task-${message.message_id}`,
    kind: "message_taken",
    status: "open",
    owner: "",
    priority: "normal",
    due_at: message.at,
    notes: "",
  }, Number(message.message_id)))
}

function filterByDate<T extends { at?: string; date?: string }>(items: T[], from?: string, to?: string): T[] {
  return items.filter((item) => {
    const raw = item.date ?? item.at
    const date = safeDate(raw)
    if (!date) return !from && !to
    const day = date.toISOString().slice(0, 10)
    return (!from || day >= from) && (!to || day <= to)
  })
}

function paginate<T>(items: T[], page: number, limit: number): { items: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)))
  const normalizedPage = Math.min(Math.max(1, page), totalPages)
  return {
    items: items.slice((normalizedPage - 1) * limit, normalizedPage * limit),
    total,
    page: normalizedPage,
    pageSize: limit,
    totalPages,
  }
}

function messageForResponse(response: Response, payload: unknown): string {
  const detail = payload && typeof payload === "object" && "error" in payload ? String((payload as { error?: unknown }).error ?? "") : ""
  if (response.status === 409) return "Cette tâche a été modifiée ailleurs. Rechargez la liste avant de réessayer."
  return detail || `Impossible de charger les données (${response.status}).`
}

export function usePaginatedCalls(filters: PageFilters = {}): PageState<OperationalCall> & { refresh: () => void } {
  const { tenant, tenantId, refreshTick, demoEnabled } = usePractice()
  const [state, setState] = useState<PageState<OperationalCall>>({ items: [], total: 0, page: 1, pageSize: DEFAULT_LIMIT, totalPages: 1, loading: true, error: null })
  const [refreshKey, setRefreshKey] = useState(0)
  const page = filters.page ?? 1
  const limit = filters.limit ?? DEFAULT_LIMIT
  const q = filters.q?.trim() ?? ""
  const type = filters.type ?? ""
  const from = filters.from ?? ""
  const to = filters.to ?? ""

  useEffect(() => {
    if (!tenantId || !tenant) return
    const controller = new AbortController()
    let active = true
    setState((current) => ({ ...current, loading: true, error: null }))

    if (demoEnabled) {
      const all = demoCallItems(tenantId, tenant).map(call=>({...call,at:String(call.id).replace(/^demo-/,"").replace(/_(\d{2})-(\d{2})-(\d{2})(?:_[a-f0-9]{8})?$/, "T$1:$2:$3")}))
      const filtered = filterByDate(all, from, to).filter((call) => {
        if (type && (call.type ?? "inconnu") !== type) return false
        if (!q) return true
        return `${call.patient ?? ""} ${call.summary ?? ""}`.toLocaleLowerCase().includes(q.toLocaleLowerCase())
      })
      const result = paginate(filtered, page, limit)
      setState({ ...result, loading: false, error: null })
      return () => { active = false }
    }

    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (q) params.set("q", q)
    if (type) params.set("type", type)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    fetch(`/api/tenants/${encodeURIComponent(tenantId)}/calls?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(messageForResponse(response, payload))
        const rows = Array.isArray(payload?.calls) ? payload.calls.map((row: Record<string, unknown>) => mapCall(row)) : []
        return { rows, page: asPage(payload, rows.length) }
      })
      .then(({ rows, page: pageInfo }) => {
        if (!active) return
        setState({ items: rows, ...pageInfo, loading: false, error: null })
      })
      .catch((reason: unknown) => {
        if (!active || (reason instanceof DOMException && reason.name === "AbortError")) return
        setState((current) => ({ ...current, items: [], loading: false, error: reason instanceof Error ? reason.message : "Impossible de charger les appels." }))
      })
    return () => { active = false; controller.abort() }
  }, [tenant, tenantId, refreshTick, demoEnabled, refreshKey, page, limit, q, type, from, to])

  return { ...state, refresh: useCallback(() => setRefreshKey((value) => value + 1), []) }
}

export function usePaginatedBookings(filters: PageFilters = {}): PageState<OperationalEvent> & { refresh: () => void } {
  return usePaginatedActivity("bookings", filters)
}

export function usePaginatedActivity(kind: "bookings" | "messages", filters: PageFilters = {}): PageState<OperationalEvent> & { refresh: () => void } {
  const { tenant, tenantId, refreshTick, demoEnabled } = usePractice()
  const [state, setState] = useState<PageState<OperationalEvent>>({ items: [], total: 0, page: 1, pageSize: DEFAULT_LIMIT, totalPages: 1, loading: true, error: null })
  const [refreshKey, setRefreshKey] = useState(0)
  const page = filters.page ?? 1
  const limit = filters.limit ?? DEFAULT_LIMIT
  const q = filters.q?.trim() ?? ""
  const from = filters.from ?? ""
  const to = filters.to ?? ""

  useEffect(() => {
    if (!tenantId || !tenant) return
    const controller = new AbortController()
    let active = true
    setState((current) => ({ ...current, loading: true, error: null }))
    const haystack = (event: OperationalEvent) => `${event.customer_name ?? ""} ${event.phone ?? ""} ${event.service ?? ""} ${event.message ?? ""}`.toLocaleLowerCase()

    if (demoEnabled) {
      const all = kind === "bookings" ? demoBookingItems(tenantId, tenant) : demoMessageItems(tenantId, tenant)
      const filtered = filterByDate(all, from, to).filter((event) => !q || haystack(event).includes(q.toLocaleLowerCase()))
      const result = paginate(filtered, page, limit)
      setState({ ...result, loading: false, error: null })
      return () => { active = false }
    }

    const params = new URLSearchParams({ kind, page: String(page), limit: String(limit) })
    if (q) params.set("q", q)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    fetch(`/api/tenants/${encodeURIComponent(tenantId)}/activity?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(messageForResponse(response, payload))
        const raw = kind === "bookings" ? payload?.bookings : payload?.messages
        const rows = Array.isArray(raw) ? raw.map((row: Record<string, unknown>, index: number) => mapEvent(row, index)) : []
        return { rows, page: asPage(payload, rows.length) }
      })
      .then(({ rows, page: pageInfo }) => {
        if (!active) return
        setState({ items: rows, ...pageInfo, loading: false, error: null })
      })
      .catch((reason: unknown) => {
        if (!active || (reason instanceof DOMException && reason.name === "AbortError")) return
        setState((current) => ({ ...current, items: [], loading: false, error: reason instanceof Error ? reason.message : "Impossible de charger les données." }))
      })
    return () => { active = false; controller.abort() }
  }, [tenant, tenantId, refreshTick, demoEnabled, refreshKey, kind, page, limit, q, from, to])

  return { ...state, refresh: useCallback(() => setRefreshKey((value) => value + 1), []) }
}

export type TaskPatch = {
  status: "open" | "resolved"
  owner: string
  priority: "normal" | "urgent"
  due_at: string
  notes: string
}

export function useInboxTasks(filters: PageFilters & { status?: "all" | "open" | "resolved" } = {}) {
  const { tenant, tenantId, refreshTick, demoEnabled } = usePractice()
  const [state, setState] = useState<PageState<OperationalEvent>>({ items: [], total: 0, page: 1, pageSize: DEFAULT_LIMIT, totalPages: 1, loading: true, error: null })
  const [refreshKey, setRefreshKey] = useState(0)
  const [demoTasks, setDemoTasks] = useState<OperationalEvent[] | null>(null)
  const page = filters.page ?? 1
  const limit = filters.limit ?? DEFAULT_LIMIT
  const q = filters.q?.trim() ?? ""
  const from = filters.from ?? ""
  const to = filters.to ?? ""
  const status = filters.status ?? "all"

  useEffect(() => {
    if (!tenantId || !tenant) return
    const controller = new AbortController()
    let active = true
    setState((current) => ({ ...current, loading: true, error: null }))

    if (demoEnabled) {
      const all = demoTasks ?? demoMessageItems(tenantId, tenant)
      const filtered = filterByDate(all, from, to).filter((task) => {
        if (status !== "all" && task.status !== status) return false
        if (!q) return true
        return `${task.customer_name ?? ""} ${task.phone ?? ""} ${task.message ?? ""} ${task.owner ?? ""} ${task.notes ?? ""}`.toLocaleLowerCase().includes(q.toLocaleLowerCase())
      })
      const result = paginate(filtered, page, limit)
      setState({ ...result, loading: false, error: null })
      return () => { active = false }
    }

    const params = new URLSearchParams({ kind: "messages", status, page: String(page), limit: String(limit) })
    if (q) params.set("q", q)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    fetch(`/api/tenants/${encodeURIComponent(tenantId)}/activity?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(messageForResponse(response, payload))
        const rows = Array.isArray(payload?.messages) ? payload.messages.map((row: Record<string, unknown>, index: number) => mapEvent(row, index)) : []
        return { rows, page: asPage(payload, rows.length) }
      })
      .then(({ rows, page: pageInfo }) => {
        if (!active) return
        setState({ items: rows, ...pageInfo, loading: false, error: null })
      })
      .catch((reason: unknown) => {
        if (!active || (reason instanceof DOMException && reason.name === "AbortError")) return
        setState((current) => ({ ...current, items: [], loading: false, error: reason instanceof Error ? reason.message : "Impossible de charger la boîte de réception." }))
      })
    return () => { active = false; controller.abort() }
  }, [tenant, tenantId, refreshTick, demoEnabled, refreshKey, demoTasks, page, limit, q, from, to, status])

  const updateTask = useCallback(async (task: OperationalEvent, patch: TaskPatch) => {
    if (!tenantId) return false
    if (demoEnabled) {
      setDemoTasks((current) => {
        const base = current ?? []
        const source = base.length > 0 ? base : tenant ? demoMessageItems(tenantId,tenant) : state.items
        return source.map((item) => item.id === task.id ? { ...item, ...patch, version: (item.version ?? 0) + 1 } : item)
      })
      setState((current) => ({ ...current, items: current.items.map((item) => item.id === task.id ? { ...item, ...patch, version: (item.version ?? 0) + 1 } : item) }))
      return true
    }

    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, ...patch, version: task.version ?? 0 }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(messageForResponse(response, payload))
      const saved = payload?.task ? mapEvent(payload.task as Record<string, unknown>, 0) : { ...task, ...patch }
      setState((current) => ({ ...current, items: current.items.map((item) => item.id === task.id ? saved : item), error: null }))
      setRefreshKey((value) => value + 1)
      return true
    } catch (reason) {
      setState((current) => ({ ...current, error: reason instanceof Error ? reason.message : "Impossible d'enregistrer la tâche." }))
      return false
    }
  }, [demoEnabled, state.items, tenantId,tenant])

  const refresh = useCallback(() => {
    setDemoTasks(null)
    setRefreshKey((value) => value + 1)
  }, [])
  return useMemo(() => ({ ...state, updateTask, refresh }), [state, updateTask, refresh])
}
