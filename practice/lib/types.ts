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
}

export type ActivityEvent = {
  kind: string
  at: string
  tenant?: string
  [key: string]: unknown
}

export type Activity = {
  total_events: number
  bookings: ActivityEvent[]
  messages: ActivityEvent[]
}
