import { DatabaseSync } from "node:sqlite"
import { createHash, randomUUID } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import type { Adapter, AdapterUser } from "next-auth/adapters"
import { practiceAgentDir } from "./auth-policy.ts"

export function validLoginEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.normalize("NFKC").trim().toLowerCase()
  return email.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(email) ? email : null
}

export class EmailAuthStore {
  readonly db: DatabaseSync
  constructor(filename: string) {
    fs.mkdirSync(path.dirname(filename), { recursive: true })
    this.db = new DatabaseSync(filename)
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS email_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, verified INTEGER);
      CREATE TABLE IF NOT EXISTS email_tokens (identifier TEXT NOT NULL, token TEXT PRIMARY KEY, expires INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS email_tokens_expiry ON email_tokens(expires);
      CREATE TABLE IF NOT EXISTS email_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset INTEGER NOT NULL);`)
  }
  close() { this.db.close() }
  user(field: "id" | "email", value: string): AdapterUser | null {
    const row = this.db.prepare(`SELECT * FROM email_users WHERE ${field}=?`).get(value) as {id:string;email:string;verified:number|null}|undefined
    return row ? { id:row.id, email:row.email, emailVerified:row.verified ? new Date(row.verified) : null } : null
  }
  // One transaction shared by all workers using this database; keys contain hashes, not email addresses.
  allowRequest(email: string, now = Date.now()): boolean {
    this.db.exec("BEGIN IMMEDIATE")
    try {
      this.db.prepare("DELETE FROM email_limits WHERE reset<=?").run(now)
      const keys = [["global",100], [createHash("sha256").update(email).digest("hex"),3]] as const
      const allowed = keys.every(([key, limit]) => Number(this.db.prepare("SELECT count FROM email_limits WHERE key=?").get(key)?.count || 0) < limit)
      if (allowed) for (const [key] of keys) this.db.prepare("INSERT INTO email_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1").run(key,now+15*60_000)
      this.db.exec("COMMIT")
      return allowed
    } catch(error) { this.db.exec("ROLLBACK"); throw error }
  }
  adapter(): Adapter {
    return {
      getUser: async id => this.user("id",id),
      getUserByEmail: async email => this.user("email",email),
      createUser: async user => {
        const id = randomUUID()
        this.db.prepare("INSERT INTO email_users VALUES (?,?,?)").run(id,user.email,user.emailVerified?.getTime() ?? null)
        return this.user("id",id)!
      },
      updateUser: async user => {
        this.db.prepare("UPDATE email_users SET verified=? WHERE id=?").run(user.emailVerified?.getTime() ?? null,user.id)
        const found = this.user("id",user.id)
        if (!found) throw new Error("Unknown email account")
        return found
      },
      createVerificationToken: async value => {
        // Auth.js hashes the random token with AUTH_SECRET before this method.
        this.db.prepare("DELETE FROM email_tokens WHERE expires<=?").run(Date.now())
        this.db.prepare("INSERT INTO email_tokens VALUES (?,?,?)").run(value.identifier,value.token,value.expires.getTime())
        return value
      },
      useVerificationToken: async ({identifier,token}) => {
        const row = this.db.prepare("DELETE FROM email_tokens WHERE identifier=? AND token=? RETURNING *").get(identifier,token) as {identifier:string;token:string;expires:number}|undefined
        return row && row.expires > Date.now() ? {...row,expires:new Date(row.expires)} : null
      },
    }
  }
}
let instance: EmailAuthStore | undefined
export function emailAuthStore() {
  return instance ??= new EmailAuthStore(process.env.PRACTICE_AUTH_DB || path.join(practiceAgentDir(),"email-auth.sqlite"))
}
// Lazy database access: compiling the app never creates a runtime database.
export const emailAdapter: Adapter = Object.fromEntries(
  ["getUser","getUserByEmail","createUser","updateUser","createVerificationToken","useVerificationToken"].map(name => [name, (...args: unknown[]) => {
    const fn = emailAuthStore().adapter()[name as keyof Adapter] as (...values: unknown[]) => unknown
    return fn(...args)
  }])
)
