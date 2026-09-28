import { handlers, authReady } from "@/auth"
import type { NextRequest } from "next/server"
const unavailable = () => Response.json({ error: "Connexion en cours de configuration." }, { status: 503 })
export const GET = (req: NextRequest) => authReady() ? handlers.GET(req) : unavailable()
export const POST = (req: NextRequest) => authReady() ? handlers.POST(req) : unavailable()
