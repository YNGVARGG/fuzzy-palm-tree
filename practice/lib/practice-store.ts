import { DatabaseSync, type SQLInputValue } from "node:sqlite"
import fs from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"
import type { ActivityEvent } from "./types"

export type Query = { page?: number; limit?: number; q?: string; type?: string; from?: string; to?: string; status?: string }
export class ConflictError extends Error {}

// SQLite is a durable read model for the existing agent's files, and the source
// of truth for staff task updates. No voice-pipeline change or destructive migration.
export class PracticeStore {
  readonly db: DatabaseSync
  readonly root: string
  private eventSync: Promise<void> | null = null
  private callSync = new Map<string, Promise<void>>()
  constructor(root: string, database: string) {
    this.root = root
    this.db = new DatabaseSync(database)
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY, tenant TEXT NOT NULL, kind TEXT NOT NULL, at TEXT NOT NULL,
        day TEXT NOT NULL, search TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS events_scope ON events(tenant,kind,at DESC,id);
      CREATE INDEX IF NOT EXISTS events_day ON events(tenant,day);
      CREATE INDEX IF NOT EXISTS events_appointment_day ON events(tenant,kind,coalesce(json_extract(payload,'$.date'),day));
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY, tenant TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
        owner TEXT NOT NULL DEFAULT '', priority TEXT NOT NULL DEFAULT 'normal',
        due_at TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS task_history (
        id INTEGER PRIMARY KEY, task_id TEXT NOT NULL, tenant TEXT NOT NULL, at TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS task_history_scope ON task_history(tenant,task_id,id);
      CREATE TABLE IF NOT EXISTS calls (
        tenant TEXT NOT NULL, id TEXT NOT NULL, day TEXT NOT NULL, type TEXT NOT NULL,
        search TEXT NOT NULL, payload TEXT NOT NULL, complete INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY(tenant,id));
      CREATE INDEX IF NOT EXISTS calls_day ON calls(tenant,day,id DESC);
      CREATE INDEX IF NOT EXISTS calls_type ON calls(tenant,type,id DESC);
      CREATE TABLE IF NOT EXISTS cursors (id TEXT PRIMARY KEY, payload TEXT NOT NULL);`)
  }
  close() { this.db.close() }
  private transaction(fn: () => void) {
    this.db.exec("BEGIN IMMEDIATE")
    try { fn(); this.db.exec("COMMIT") } catch (error) { this.db.exec("ROLLBACK"); throw error }
  }
  async syncEvents() {
    if (this.eventSync) return this.eventSync
    this.eventSync = this.importEvents().finally(() => { this.eventSync = null })
    return this.eventSync
  }
  private async importEvents() {
    const file = path.join(this.root, "call-activity.jsonl")
    const stat = await fs.stat(file).catch((error) => { if (error.code === "ENOENT") return null; throw error })
    if (!stat) {
      this.transaction(() => { this.db.exec("DELETE FROM events; DELETE FROM tasks; DELETE FROM task_history; DELETE FROM cursors WHERE id='events'") })
      return
    }
    const row = this.db.prepare("SELECT payload FROM cursors WHERE id='events'").get()
    const previous = row ? JSON.parse(String(row.payload)) : { offset: 0, mtime: 0, tail: "" }
    if (previous.offset === stat.size && previous.mtime === stat.mtimeMs) return
    const handle = await fs.open(file, "r")
    try {
      let offset = previous.offset as number
      let reset = offset > stat.size || (offset === stat.size && previous.mtime !== stat.mtimeMs)
      if (offset && !reset) {
        const tail = Buffer.alloc(Math.min(256, offset))
        await handle.read(tail, 0, tail.length, offset - tail.length)
        reset = tail.toString("base64") !== previous.tail
      }
      if (reset) { this.db.exec("DELETE FROM events"); offset = 0 }
      const insert = this.db.prepare("INSERT OR IGNORE INTO events VALUES (?,?,?,?,?,?,?)")
      let pending = Buffer.alloc(0)
      let position = offset
      let committed = offset
      const buffer = Buffer.alloc(64 * 1024)
      while (position < stat.size) {
        const { bytesRead } = await handle.read(buffer, 0, Math.min(buffer.length, stat.size - position), position)
        if (!bytesRead) break
        position += bytesRead
        pending = Buffer.concat([pending, buffer.subarray(0, bytesRead)])
        const end = pending.lastIndexOf(10)
        if (end < 0) {
          if (pending.length > 4 * 1024 * 1024) throw new Error("Une ligne du journal dépasse 4 Mo.")
          continue
        }
        const lines = pending.subarray(0, end + 1).toString("utf8").split("\n")
        this.transaction(() => {
          for (const line of lines) {
            if (!line.trim()) continue
            let event: ActivityEvent
            try { event = JSON.parse(line) } catch { continue }
            if (!event || typeof event.tenant !== "string" || typeof event.kind !== "string" || typeof event.at !== "string") continue
            const id = createHash("sha256").update(line.trim()).digest("hex")
            const search = [event.customer_name,event.phone,event.service,event.message,event.reference].join(" ").toLocaleLowerCase("fr")
            insert.run(id,event.tenant,event.kind,event.at,event.at.slice(0,10),search,JSON.stringify(event))
          }
        })
        committed += end + 1
        pending = pending.subarray(end + 1)
      }
      const tail = Buffer.alloc(Math.min(256, committed))
      if (tail.length) await handle.read(tail, 0, tail.length, committed - tail.length)
      this.transaction(() => {
        this.db.prepare("INSERT OR REPLACE INTO cursors VALUES ('events',?)").run(JSON.stringify({offset:committed,mtime:stat.mtimeMs,tail:tail.toString("base64")}))
        this.db.exec("DELETE FROM tasks WHERE id NOT IN (SELECT id FROM events); DELETE FROM task_history WHERE task_id NOT IN (SELECT id FROM events)")
      })
    } finally { await handle.close() }
  }
  async syncCalls(tenant: string) {
    const existing = this.callSync.get(tenant)
    if (existing) return existing
    const job = this.importCalls(tenant).finally(() => this.callSync.delete(tenant))
    this.callSync.set(tenant, job)
    return job
  }
  private async importCalls(tenant: string) {
    const dir = path.join(this.root,"calls",tenant)
    const entries = await fs.readdir(dir,{withFileTypes:true}).catch((error) => { if (error.code === "ENOENT") return []; throw error })
    const ids = new Set(entries.filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}(?:_[a-f0-9]{8})?$/.test(d.name)).map(d=>d.name))
    const stored = this.db.prepare("SELECT id,complete FROM calls WHERE tenant=?").all(tenant)
    const complete = new Set(stored.filter(r=>r.complete===1).map(r=>String(r.id)))
    this.transaction(() => {
      const remove = this.db.prepare("DELETE FROM calls WHERE tenant=? AND id=?")
      for (const r of stored) if (!ids.has(String(r.id))) remove.run(tenant,String(r.id))
    })
    // Only new/in-progress calls need file contents. Warm list requests never
    // open historical transcripts. Directory enumeration remains O(history).
    for (const id of ids) {
      if (complete.has(id)) continue
      const base = path.join(dir,id)
      const read = (name:string) => fs.readFile(path.join(base,name),"utf8").catch(error=>{if(error.code==="ENOENT") return null;throw error})
      const [summary,metaText] = await Promise.all([read("summary.txt"),read("meta.json")])
      let meta: Record<string,unknown> = {}
      let validMeta = false
      try { if(metaText) {meta=JSON.parse(metaText); validMeta=true} } catch { /* writer may still be finishing */ }
      const hasAudio = await fs.access(path.join(base,"audio.wav")).then(()=>true).catch(()=>false)
      const payload = {id,summary:summary??"",patient:String(meta.patient??""),type:String(meta.type??"inconnu"),has_audio:hasAudio,message_count:0,recording_refused:Boolean(meta.recording_refused)}
      this.db.prepare("INSERT OR REPLACE INTO calls VALUES (?,?,?,?,?,?,?)").run(tenant,id,id.slice(0,10),payload.type,`${payload.patient} ${payload.summary}`.toLocaleLowerCase("fr"),JSON.stringify(payload),validMeta && summary!==null ? 1:0)
    }
  }
  private where(tenant:string, query:Query, alias:string) {
    const clauses=[`${alias}.tenant=?`]
    const values:SQLInputValue[]=[tenant]
    if(query.from){clauses.push(`${alias}.day>=?`);values.push(query.from)}
    if(query.to){clauses.push(`${alias}.day<=?`);values.push(query.to)}
    if(query.q){clauses.push(`instr(${alias}.search,?)>0`);values.push(query.q.toLocaleLowerCase("fr"))}
    return {clauses,values}
  }
  private page(total:number,query:Query) {
    const pageSize=Math.min(100,Math.max(1,Math.floor(query.limit||25)))
    const totalPages=Math.max(1,Math.ceil(total/pageSize))
    const page=Math.min(totalPages,Math.max(1,Math.floor(query.page||1)))
    return {total,page,pageSize,totalPages}
  }
  calls(tenant:string,query:Query={}) {
    const {clauses,values}=this.where(tenant,query,"c")
    if(query.type && query.type!=="all"){clauses.push("c.type=?");values.push(query.type)}
    const where=clauses.join(" AND ")
    const total=Number(this.db.prepare(`SELECT count(*) AS n FROM calls c WHERE ${where}`).get(...values)!.n)
    const paging=this.page(total,query)
    const rows=this.db.prepare(`SELECT payload FROM calls c WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...values,paging.pageSize,(paging.page-1)*paging.pageSize)
    return {calls:rows.map(r=>JSON.parse(String(r.payload))),...paging}
  }
  activity(tenant:string,kind:string,query:Query={}) {
    const {clauses,values}=this.where(tenant,{...query,q:kind==="messages"?undefined:query.q},"e")
    const isTask=kind==="messages"
    if(!isTask) for(let i=0;i<clauses.length;i++) clauses[i]=clauses[i].replace("e.day","coalesce(json_extract(e.payload,'$.date'),e.day)")
    if(isTask && query.q){clauses.push("(instr(e.search,?)>0 OR instr(lower(coalesce(t.owner,'')),?)>0 OR instr(lower(coalesce(t.notes,'')),?)>0)");values.push(query.q.toLocaleLowerCase("fr"),query.q.toLocaleLowerCase("fr"),query.q.toLocaleLowerCase("fr"))}
    clauses.push(isTask ? "e.kind IN ('message_taken','escalation')" : "e.kind='appointment_booked'")
    if(isTask && query.status && query.status!=="all") {clauses.push("coalesce(t.status,'open')=?");values.push(query.status)}
    const join="events e LEFT JOIN tasks t ON e.id=t.id AND e.tenant=t.tenant"
    const where=clauses.join(" AND ")
    const total=Number(this.db.prepare(`SELECT count(*) AS n FROM ${join} WHERE ${where}`).get(...values)!.n)
    const paging=this.page(total,query)
    const order=isTask ? "CASE WHEN coalesce(t.priority,CASE WHEN e.kind='escalation' THEN 'urgent' ELSE 'normal' END)='urgent' THEN 0 ELSE 1 END, CASE WHEN coalesce(t.due_at,'')='' THEN 1 ELSE 0 END,t.due_at,e.at DESC,e.id DESC" : "json_extract(e.payload,'$.date') DESC,json_extract(e.payload,'$.time') ASC,e.id DESC"
    const rows=this.db.prepare(`SELECT e.id,e.payload,t.status,t.owner,t.priority,t.due_at,t.notes,t.version FROM ${join} WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...values,paging.pageSize,(paging.page-1)*paging.pageSize)
    const records=rows.map(r=>this.eventRecord(r))
    return {bookings:isTask?[]:records,messages:isTask?records:[],total_events:total,...paging}
  }
  private eventRecord(r:Record<string,unknown>):ActivityEvent {
    const event=JSON.parse(String(r.payload))
    return {...event,id:String(r.id),status:r.status??"open",owner:r.owner??"",priority:r.priority??(event.kind==="escalation"?"urgent":"normal"),due_at:r.due_at??"",notes:r.notes??"",version:Number(r.version??0)}
  }
  bookingExport(tenant:string,query:Query={}) {
    const {clauses,values}=this.where(tenant,query,"e")
    for(let i=0;i<clauses.length;i++)clauses[i]=clauses[i].replace("e.day","coalesce(json_extract(e.payload,'$.date'),e.day)")
    clauses.push("e.kind='appointment_booked'")
    return this.db.prepare(`SELECT e.payload FROM events e WHERE ${clauses.join(" AND ")} ORDER BY json_extract(e.payload,'$.date') DESC,e.id`).iterate(...values)
  }
  updateTask(tenant:string,input:Record<string,unknown>) {
    const id=String(input.id??"")
    const row=this.db.prepare("SELECT id,payload FROM events WHERE tenant=? AND id=? AND kind IN ('message_taken','escalation')").get(tenant,id)
    if(!row) throw new Error("Demande introuvable")
    if(!["open","resolved"].includes(String(input.status)) || !["normal","urgent"].includes(String(input.priority)) || !Number.isInteger(input.version) || Number(input.version)<0) throw new Error("Statut ou version invalide")
    for(const [field,max] of [["owner",120],["notes",5000],["due_at",40]] as const) if(typeof input[field]!=="string" || String(input[field]).length>max) throw new Error("Champ invalide : "+field)
    if(input.due_at && !Number.isFinite(Date.parse(String(input.due_at)))) throw new Error("Échéance invalide")
    this.transaction(()=>{
      const current=this.db.prepare("SELECT version FROM tasks WHERE tenant=? AND id=?").get(tenant,id)
      if(Number(current?.version??0)!==input.version) throw new ConflictError("Cette demande a été modifiée. Actualisez avant d’enregistrer.")
      this.db.prepare("INSERT OR REPLACE INTO tasks VALUES (?,?,?,?,?,?,?,?)").run(id,tenant,String(input.status),String(input.owner).trim(),String(input.priority),String(input.due_at),String(input.notes),Number(input.version)+1)
      this.db.prepare("INSERT INTO task_history(task_id,tenant,at,payload) VALUES (?,?,?,?)").run(id,tenant,new Date().toISOString(),JSON.stringify(input))
    })
    return this.eventRecord({...row,...this.db.prepare("SELECT * FROM tasks WHERE tenant=? AND id=?").get(tenant,id)})
  }
  summary(tenant:string,avg:number,query:Query={}) {
    const {clauses,values}=this.where(tenant,{from:query.from,to:query.to},"e")
    const where=clauses.join(" AND ")
    const bookings=Number(this.db.prepare(`SELECT count(*) AS n FROM events e WHERE ${where} AND kind='appointment_booked'`).get(...values)!.n)
    const taskCounts=this.db.prepare(`SELECT count(*) AS n, sum(CASE WHEN coalesce(t.priority,CASE WHEN e.kind='escalation' THEN 'urgent' ELSE 'normal' END)='urgent' THEN 1 ELSE 0 END) AS urgent FROM events e LEFT JOIN tasks t ON e.id=t.id AND e.tenant=t.tenant WHERE e.tenant=? AND e.kind IN ('message_taken','escalation') AND coalesce(t.status,'open')='open'`).get(tenant)!
    const calls=this.calls(tenant,{from:query.from,to:query.to,limit:5})
    const rawSeries=this.db.prepare(`SELECT day AS date,count(*) AS bookings FROM events e WHERE ${where} AND kind='appointment_booked' GROUP BY day ORDER BY day`).all(...values)
    const series=query.from && query.to ? Array.from({length:Math.min(367,Math.floor((Date.parse(query.to)-Date.parse(query.from))/86400000)+1)},(_,i)=>{const date=new Date(Date.parse(query.from!)+i*86400000).toISOString().slice(0,10);return {date,bookings:Number(rawSeries.find(r=>r.date===date)?.bookings??0)}}) : rawSeries
    return {calls:calls.total,bookings,openTasks:Number(taskCounts.n),urgentTasks:Number(taskCounts.urgent??0),estimatedRevenue:bookings*avg,bookingCalls:null,conversion:null,series,recentCalls:calls.calls,pendingTasks:this.activity(tenant,"messages",{status:"open",limit:5}).messages}
  }
  forgetTenant(tenant:string) {
    this.transaction(()=>{
      for(const table of ["events","tasks","task_history","calls"]) this.db.prepare(`DELETE FROM ${table} WHERE tenant=?`).run(tenant)
      this.db.exec("DELETE FROM cursors WHERE id='events'")
    })
  }
}
