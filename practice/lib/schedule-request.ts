import { randomUUID } from "node:crypto"
export function makeScheduleRequest(body: Record<string, unknown>, services: string[], now = new Date()) {
  const field = (name: string, max: number) => typeof body[name] === "string" ? body[name].trim().slice(0, max + 1) : ""
  const name = field("name",100), phone = field("phone",30), service = field("service",150), date = field("date",10), time = field("time",5)
  if (!name || name.length>100 || !/^[+\d ()-]{6,30}$/.test(phone) || !services.includes(service)) throw new Error("Vérifiez le nom, le téléphone et le motif.")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Date ou heure invalide.")
  const day = new Date(`${date}T12:00:00Z`)
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0,10)!==date || date < now.toISOString().slice(0,10) || day.getTime() > now.getTime()+366*86400000) throw new Error("Choisissez une date à venir dans les douze prochains mois.")
  return { kind:"message_taken", source:"online_schedule", status:"open", at:now.toISOString(), reference:randomUUID(), customer_name:name, phone, service, date, time, message:`Demande de rendez-vous à confirmer : ${service}, le ${date} à ${time}.` }
}
