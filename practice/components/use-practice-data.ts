"use client"

import { useEffect, useMemo, useState } from "react"
import { usePractice } from "@/components/practice-context"
import { demoBookings, demoCalls, demoMessages, type DemoCall } from "@/lib/demo"
import type { ActivityEvent } from "@/lib/types"

export type CallItem = {
  id: string
  summary: string
  message_count: number
  has_audio: boolean
  messages?: { role: string; content: string }[]
}

export type PracticeData = {
  bookings: ActivityEvent[]
  messages: ActivityEvent[]
  calls: CallItem[]
  loading: boolean
  demo: boolean
  isEmpty: boolean
}

export function usePracticeData(): PracticeData {
  const { tenant, tenantId, refreshTick, demoEnabled } = usePractice()
  const [real, setReal] = useState<{ bookings: ActivityEvent[]; messages: ActivityEvent[]; calls: CallItem[] } | null>(null)

  useEffect(() => {
    if (!tenantId) return
    setReal(null)
    Promise.all([
      fetch("/api/tenants/" + tenantId + "/activity").then((r) => r.json()).catch(() => null),
      fetch("/api/tenants/" + tenantId + "/calls").then((r) => r.json()).catch(() => null),
    ]).then(([a, c]) => {
      setReal({
        bookings: a?.bookings ?? [],
        messages: a?.messages ?? [],
        calls: (c?.calls ?? []).map((x: CallItem) => x),
      })
    })
  }, [tenantId, refreshTick])

  return useMemo<PracticeData>(() => {
    const loading = !tenant || !real
    const demo = demoEnabled && !!tenant
    if (loading) {
      return { bookings: [], messages: [], calls: [], loading: true, demo, isEmpty: true }
    }
    if (demo) {
      const bookings = demoBookings(tenantId, tenant!).map((b) => ({ kind: "appointment_booked", ...b }))
      const messages = demoMessages(tenantId, tenant!).map((m) => ({ kind: "message_taken", ...m }))
      const calls: CallItem[] = (demoCalls(tenantId, tenant!) as DemoCall[]).map((c) => ({
        id: "demo-" + c.id,
        summary: c.summary,
        message_count: c.message_count,
        has_audio: false,
        messages: c.messages,
      }))
      return { bookings, messages, calls, loading: false, demo: true, isEmpty: false }
    }
    const isEmpty = real!.bookings.length === 0 && real!.calls.length === 0
    return { ...real!, loading: false, demo: false, isEmpty }
  }, [real, tenant, demoEnabled])
}