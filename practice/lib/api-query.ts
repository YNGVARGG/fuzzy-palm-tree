import { NextResponse } from "next/server"
import { ConflictError, type Query } from "./practice-store"
import { NotFoundError } from "./server-data"

export function parseQuery(req: Request): Query {
  const params = new URL(req.url).searchParams
  const day = (key: string) => {
    const value = params.get(key) || undefined
    if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)) throw new Error("Date invalide")
    return value
  }
  const number = (key:string,fallback:number,max:number) => {
    const raw=params.get(key)
    if(raw===null) return fallback
    const n=Number(raw)
    if(!Number.isSafeInteger(n)||n<1) throw new Error("Pagination invalide")
    return Math.min(n,max)
  }
  const query={page:number("page",1,1_000_000),limit:number("limit",25,100),q:(params.get("q")||"").trim().slice(0,200),type:params.get("type")||"all",status:params.get("status")||"all",from:day("from"),to:day("to")}
  if(query.from && query.to && query.from>query.to) throw new Error("La date de début doit précéder la date de fin")
  if(!["all","open","resolved"].includes(query.status)) throw new Error("Statut invalide")
  return query
}
export function apiError(error:unknown) {
  if(error instanceof NotFoundError) return NextResponse.json({error:error.message},{status:404})
  if(error instanceof ConflictError) return NextResponse.json({error:error.message},{status:409})
  // Validation errors are safe; avoid returning filesystem paths/SQL to the browser.
  const message=error instanceof Error?error.message:""
  const validation=/^(Date invalide|Pagination invalide|La date de début|Statut|Champ invalide|Échéance invalide|Demande introuvable)/.test(message)
  if(!validation) console.error("Practice request failed",error)
  return NextResponse.json({error:validation?message:"Impossible de charger les données. Réessayez."},{status:validation?400:500})
}
