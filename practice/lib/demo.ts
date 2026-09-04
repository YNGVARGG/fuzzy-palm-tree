// Deterministic demo data — makes the dashboard feel alive before real calls exist.
// All values are generated client-side from the tenant id + today. Clearly labeled in the UI.

import type { Tenant } from "@/lib/types"

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NAMES = [
  "Sophie Martin", "Thomas Bernard", "Léa Petit", "Hugo Dubois", "Camille Moreau",
  "Nathan Laurent", "Emma Lefèvre", "Louis Roux", "Chloé Fournier", "Antoine Girard",
  "Manon Bonnet", "Jules Fontaine", "Inès Caron", "Raphaël Mercier",
]

const TIMES = ["09:00", "09:45", "10:30", "11:15", "14:00", "14:45", "15:30", "16:15", "17:00"]

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export type DemoBooking = {
  reference: string
  date: string
  time: string
  service: string
  customer_name: string
  phone: string
  at: string
}

export type DemoCall = {
  id: string
  summary: string
  message_count: number
  has_audio: boolean
  messages: { role: string; content: string }[]
  kind: "rdv" | "message" | "question"
}

export function demoBookings(tenantId: string, tenant: Tenant, days = 14): DemoBooking[] {
  const rnd = mulberry32(hashStr("bk:" + tenantId + ":" + iso(new Date())))
  const out: DemoBooking[] = []
  const services = tenant.services && tenant.services.length > 0 ? tenant.services : ["Consultation", "Soin", "Contrôle"]
  const avgPhone = (n: number) => "06 " + String(10 + (n % 89)) + " " + String(10 + (n % 89)) + " " + String(10 + (n % 89)) + " " + String(10 + (n % 89))
  let ref = 2100
  for (let i = days; i >= 1; i--) {
    const d = new Date(Date.now() - i * 86400000)
    if (d.getDay() === 0) continue // closed Sunday
    const count = 1 + Math.floor(rnd() * 3)
    for (let j = 0; j < count; j++) {
      const t = TIMES[Math.floor(rnd() * TIMES.length)]
      const name = NAMES[Math.floor(rnd() * NAMES.length)]
      const service = services[Math.floor(rnd() * services.length)]
      const h = new Date(d)
      h.setHours(8 + Math.floor(rnd() * 8), Math.floor(rnd() * 59))
      out.push({
        reference: String(ref++),
        date: iso(d),
        time: t,
        service,
        customer_name: name,
        phone: avgPhone(Math.floor(rnd() * 10000)),
        at: h.toISOString(),
      })
    }
  }
  return out.sort((a, b) => b.at.localeCompare(a.at))
}

export function demoMessages(tenantId: string, tenant: Tenant, days = 14): { message_id: number; customer_name: string; phone: string; message: string; at: string }[] {
  const rnd = mulberry32(hashStr("msg:" + tenantId + ":" + iso(new Date())))
  const topics = [
    "Souhaite un devis pour une couronne — demande un rappel de l'assistante.",
    "Question sur le remboursement mutuelle avant de prendre rendez-vous.",
    "Veut déplacer son rendez-vous d'orthodontie la semaine prochaine.",
    "Douleur légère depuis hier — demande si une urgence est possible ce soir.",
    "Appelle pour sa mère qui ne peut pas se déplacer — cherche un chirurgien à domicile.",
  ]
  const out: { message_id: number; customer_name: string; phone: string; message: string; at: string }[] = []
  for (let i = 0; i < 3; i++) {
    const dayOffset = 1 + Math.floor(rnd() * (days - 2))
    const d = new Date(Date.now() - dayOffset * 86400000)
    d.setHours(17 + Math.floor(rnd() * 3), Math.floor(rnd() * 59))
    out.push({
      message_id: i + 1,
      customer_name: NAMES[Math.floor(rnd() * NAMES.length)],
      phone: "06 12 34 56 7" + Math.floor(rnd() * 9),
      message: topics[i],
      at: d.toISOString(),
    })
  }
  return out
}

export function demoCalls(tenantId: string, tenant: Tenant, days = 14): DemoCall[] {
  const rnd = mulberry32(hashStr("call:" + tenantId + ":" + iso(new Date())))
  const services = tenant.services && tenant.services.length > 0 ? tenant.services : ["Consultation"]
  const out: DemoCall[] = []
  for (let i = days; i >= 1; i--) {
    const d = new Date(Date.now() - i * 86400000)
    if (d.getDay() === 0) continue
    const n = 2 + Math.floor(rnd() * 4)
    for (let j = 0; j < n; j++) {
      const h = new Date(d)
      h.setHours(9 + Math.floor(rnd() * 10), Math.floor(rnd() * 59), Math.floor(rnd() * 59))
      const pad = (x: number) => String(x).padStart(2, "0")
      const id = iso(d) + "_" + pad(h.getHours()) + "-" + pad(h.getMinutes()) + "-" + pad(h.getSeconds())
      const roll = rnd()
      const name = NAMES[Math.floor(rnd() * NAMES.length)]
      const service = services[Math.floor(rnd() * services.length)]
      if (roll < 0.6) {
        out.push({
          id, kind: "rdv", has_audio: false, message_count: 6,
          summary: name + " a réservé un rendez-vous (" + service + ") — confirmé par l'agent.",
          messages: [
            { role: "user", content: "Bonjour, je voudrais prendre rendez-vous pour " + service.toLowerCase() + "." },
            { role: "assistant", content: "Bien sûr. Auriez-vous une préférence de jour ou d'horaire ?" },
            { role: "user", content: "Plutôt en fin de semaine, le matin si possible." },
            { role: "assistant", content: "Parfait, je vous propose vendredi à 9h. Puis-je avoir votre nom et un numéro pour confirmer ?" },
            { role: "user", content: name + ", au 06 12 34 56 78." },
            { role: "assistant", content: "Merci " + name.split(" ")[0] + ", c'est noté : vendredi à 9h pour " + service.toLowerCase() + ". Un SMS de rappel vous sera envoyé. À bientôt." },
          ],
        })
      } else if (roll < 0.85) {
        out.push({
          id, kind: "question", has_audio: false, message_count: 4,
          summary: "Question de " + name + " sur les horaires et la mutuelle — répondue par l'agent.",
          messages: [
            { role: "user", content: "Bonjour, quelles sont vos heures d'ouverture le samedi ?" },
            { role: "assistant", content: "Nous sommes ouverts le samedi de 9h à 13h. Comment puis-je vous aider ?" },
            { role: "user", content: "Et est-ce que vous pratiquez le tiers payant ?" },
            { role: "assistant", content: "Oui, avec la plupart des mutuelles — vous n'avancez généralement rien pour les soins courants." },
          ],
        })
      } else {
        out.push({
          id, kind: "message", has_audio: false, message_count: 5,
          summary: name + " a laissé un message (demande de rappel) — à traiter par l'équipe.",
          messages: [
            { role: "user", content: "Bonjour, l'assistante pourrait-elle me rappeler pour un devis ?" },
            { role: "assistant", content: "Bien sûr, je prends votre nom et votre numéro." },
            { role: "user", content: name + ", 06 12 34 56 78." },
            { role: "assistant", content: "C'est noté. Quelqu'un vous rappellera sous un jour ouvrable. Autre chose ?" },
            { role: "user", content: "Non merci, au revoir." },
          ],
        })
      }
    }
  }
  return out.sort((a, b) => b.id.localeCompare(a.id))
}