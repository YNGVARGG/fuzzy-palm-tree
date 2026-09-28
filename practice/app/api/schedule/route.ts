import fs from "node:fs"
import { LOG_FILE, readTenant } from "@/lib/server-data"
import { isTrustedMutationOrigin } from "@/lib/auth-policy"
import { makeScheduleRequest } from "@/lib/schedule-request"

// Bounded single-server abuse guard. Add an edge rate limiter before public rollout.
const recent = new Map<string, { count: number; until: number }>()
export async function POST(req: Request) {
  if (!isTrustedMutationOrigin(req)) return Response.json({ error:"Origine refusée." }, { status:403 })
  if (!req.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error:"Format invalide." },{status:415})
  try {
    const reader = req.body?.getReader()
    if (!reader) throw new Error("Formulaire vide.")
    const chunks: Uint8Array[] = []; let size=0
    while (true) { const {value,done}=await reader.read(); if(done)break; size+=value.length; if(size>4096){await reader.cancel();return Response.json({error:"Formulaire trop volumineux."},{status:413})} chunks.push(value) }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    let tenant
    try { tenant = readTenant(body.practice); if(tenant.public_booking_enabled!==true)throw new Error() }
    catch { return Response.json({error:"Ce formulaire est indisponible."},{status:404}) }
    const now=Date.now()
    for(const [key,value] of recent)if(value.until<now)recent.delete(key)
    const key=String(body.practice)
    const usage=recent.get(key)??{count:0,until:now+60000}
    if(usage.count>=20)return Response.json({error:"Trop de demandes. Réessayez dans une minute."},{status:429,headers:{"Retry-After":"60"}})
    usage.count++; recent.set(key,usage)
    const event = makeScheduleRequest(body, Array.isArray(tenant.services)?tenant.services.map(String):["Consultation"])
    fs.appendFileSync(LOG_FILE,JSON.stringify({...event,tenant:body.practice})+"\n","utf8")
    return Response.json({created:true,confirmed:false,reference:event.reference,date:event.date,time:event.time},{status:201,headers:{"Cache-Control":"no-store"}})
  } catch(error) { return Response.json({error:error instanceof SyntaxError?"Formulaire invalide.":"Impossible d’enregistrer. Vérifiez les champs et réessayez."},{status:400}) }
}
