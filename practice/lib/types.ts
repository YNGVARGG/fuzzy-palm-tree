export type TenantSummary = { id: string; name: string; language: string }

export type Tenant = {
  name: string
  tagline: string
  greeting_name: string
  language: string
  hours: string
  after_hours_note: string
  booking_slots: string
  callback_promise: string
  services: string[]
  faq: Record<string, string>
  phone_numbers?: string[]
  avg_appointment_value?: number
  missed_calls_per_month?: number
  providers?: string[]
  insurance?: string
  languages?: string[]
}

export type ActivityEvent = {
  id?: string
  kind: string
  at: string
  tenant?: string
  status?: "open" | "resolved"
  owner?: string
  priority?: "normal" | "urgent"
  due_at?: string
  notes?: string
  version?: number
  [key: string]: unknown
}

export type PracticeSummary = {
  calls: number
  bookings: number
  openTasks: number
  urgentTasks: number
  estimatedRevenue: number
  bookingCalls: number | null
  conversion: number | null
  series: { date: string; bookings: number }[]
  recentCalls: { id: string; summary: string; patient?: string; type?: string; has_audio: boolean; message_count: number }[]
  pendingTasks: ActivityEvent[]
  from?: string
  to?: string
}

export type Activity = {
  total_events: number
  bookings: ActivityEvent[]
  messages: ActivityEvent[]
}
