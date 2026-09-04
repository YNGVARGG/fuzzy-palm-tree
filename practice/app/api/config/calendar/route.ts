import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { AGENT_DIR } from "@/lib/server-data"

export async function GET() {
  const envPath = path.join(AGENT_DIR, ".env")
  let envText = ""
  if (fs.existsSync(envPath)) envText = fs.readFileSync(envPath, "utf8")
  const get = (k: string) => {
    const m = envText.match(new RegExp("^" + k + "=(.*)$", "m"))
    return m ? m[1].trim() : ""
  }
  const creds = get("GOOGLE_CALENDAR_CREDENTIALS")
  const calId = get("GOOGLE_CALENDAR_ID")
  const configured = Boolean(creds && calId)
  return NextResponse.json({
    configured,
    provider: "google-calendar",
    calendar_id: configured ? calId : null,
  })
}
