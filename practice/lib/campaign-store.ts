import { DatabaseSync } from "node:sqlite"
import { randomUUID, createHash, timingSafeEqual } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { practiceAgentDir } from "./auth-policy.ts"

export type Campaign = {id:string;tenant:string;name:string;template:string;timezone:string;status:string;created_at:string;total:number;pending:number;simulated:number;suppressed:number}
export const DEFAULT_REMINDER = "Bonjour, rappel de votre rendez-vous au cabinet le {date}. Pour toute modification, contactez le cabinet."
export function campaignWorkflowAccess(header:string|null, tenant:string):boolean {
  const secret=process.env.CAMPAIGN_WORKFLOW_TOKEN
  if(!secret || secret.length<32 || process.env.CAMPAIGN_WORKFLOW_TENANT!==tenant || !header?.startsWith('Bearer '))return false
  return timingSafeEqual(createHash('sha256').update(header.slice(7)).digest(),createHash('sha256').update(secret).digest())
}
export class CampaignStore {
 readonly db:DatabaseSync
 constructor(file:string){
  fs.mkdirSync(path.dirname(file),{recursive:true});this.db=new DatabaseSync(file)
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS campaigns(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,name TEXT NOT NULL,template TEXT NOT NULL,timezone TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS campaign_recipients(id TEXT PRIMARY KEY,campaign TEXT NOT NULL,tenant TEXT NOT NULL,phone TEXT NOT NULL,appointment_at TEXT NOT NULL,due_at TEXT NOT NULL,allowed INTEGER NOT NULL,status TEXT NOT NULL,processed_at TEXT,UNIQUE(tenant,phone,appointment_at));
   CREATE INDEX IF NOT EXISTS campaign_due ON campaign_recipients(tenant,status,due_at);
   CREATE INDEX IF NOT EXISTS campaign_scope ON campaigns(tenant,created_at);`)
 }
 close(){this.db.close()}
 list(tenant:string):Campaign[]{return this.db.prepare(`SELECT c.*,count(r.id) total,coalesce(sum(r.status='pending'),0) pending,coalesce(sum(r.status='simulated'),0) simulated,coalesce(sum(r.status='suppressed'),0) suppressed FROM campaigns c LEFT JOIN campaign_recipients r ON r.campaign=c.id AND r.tenant=c.tenant WHERE c.tenant=? GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100`).all(tenant) as Campaign[]}
 private campaign(tenant:string,id:string){const c=this.db.prepare('SELECT * FROM campaigns WHERE tenant=? AND id=?').get(tenant,id) as Campaign|undefined;if(!c)throw new Error('Campagne introuvable');return c}
 recipients(tenant:string,id:string){this.campaign(tenant,id);return this.db.prepare('SELECT id,phone,appointment_at,due_at,allowed,status FROM campaign_recipients WHERE tenant=? AND campaign=? ORDER BY due_at LIMIT 100').all(tenant,id)}
 create(tenant:string,input:Record<string,unknown>){
  const name=typeof input.name==='string'?input.name.trim():''
  const template=typeof input.template==='string'?input.template.trim():DEFAULT_REMINDER
  const timezone=typeof input.timezone==='string'?input.timezone:'Europe/Paris'
  if(!name||name.length>100||!template||template.length>600)throw new Error('Nom ou message invalide')
  if(!template.includes('{date}') || /\{(?!date\})/.test(template))throw new Error('Le message doit contenir {date}, sans autre variable')
  try{new Intl.DateTimeFormat('fr-FR',{timeZone:timezone}).format()}catch{throw new Error('Fuseau horaire invalide')}
  const id=randomUUID();this.db.prepare('INSERT INTO campaigns VALUES (?,?,?,?,?,?,?)').run(id,tenant,name,template,timezone,'draft',new Date().toISOString());return id
 }
 add(tenant:string,id:string,input:Record<string,unknown>,now=Date.now()){
  const c=this.campaign(tenant,id);if(c.status!=='draft')throw new Error('Les destinataires se modifient uniquement dans un brouillon')
  const phone=typeof input.phone==='string'?input.phone.trim():''
  const appointment=typeof input.appointmentAt==='string'?Date.parse(input.appointmentAt):NaN
  const due=typeof input.dueAt==='string'?Date.parse(input.dueAt):NaN
  if(!/^\+[1-9]\d{7,14}$/.test(phone)||!Number.isFinite(appointment)||!Number.isFinite(due)||appointment<=now||due>=appointment||due<now-60000)throw new Error('Numéro international ou dates invalides')
  if(input.contactAllowed!==true)throw new Error('Vérifiez l’autorisation de contact avant de préparer ce rappel')
  const result=this.db.prepare('INSERT OR IGNORE INTO campaign_recipients VALUES (?,?,?,?,?,?,?,?,NULL)').run(randomUUID(),id,tenant,phone,new Date(appointment).toISOString(),new Date(due).toISOString(),1,'pending')
  if(!result.changes)throw new Error('Un rappel existe déjà pour ce numéro et ce rendez-vous')
 }
 status(tenant:string,id:string,status:string){
  const c=this.campaign(tenant,id)
  if(!['ready','paused','draft'].includes(status))throw new Error('État invalide')
  if(status==='ready'&&!this.db.prepare("SELECT id FROM campaign_recipients WHERE tenant=? AND campaign=? AND status='pending' LIMIT 1").get(tenant,id))throw new Error('Ajoutez un destinataire avant de préparer la simulation')
  if(c.status==='ready'&&status==='draft')throw new Error('Mettez la campagne en pause avant de la modifier')
  this.db.prepare('UPDATE campaigns SET status=? WHERE tenant=? AND id=?').run(status,tenant,id)
 }
 suppress(tenant:string,id:string,recipient:string){this.campaign(tenant,id);this.db.prepare("UPDATE campaign_recipients SET allowed=0,status=CASE WHEN status='pending' THEN 'suppressed' ELSE status END WHERE tenant=? AND campaign=? AND id=?").run(tenant,id,recipient)}
 simulate(tenant:string,now=Date.now()){
  this.db.exec('BEGIN IMMEDIATE')
  try{
   const stamp=new Date(now).toISOString()
   this.db.prepare("UPDATE campaign_recipients SET status='suppressed',processed_at=? WHERE tenant=? AND status='pending' AND (allowed=0 OR appointment_at<=?)").run(stamp,tenant,stamp)
   const rows=this.db.prepare("SELECT r.id,c.timezone FROM campaign_recipients r JOIN campaigns c ON c.id=r.campaign AND c.tenant=r.tenant WHERE r.tenant=? AND r.status='pending' AND r.allowed=1 AND r.due_at<=? AND r.appointment_at>? AND c.status='ready' ORDER BY r.due_at LIMIT 100").all(tenant,stamp,stamp) as {id:string;timezone:string}[]
   let simulated=0
   for(const row of rows){
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:row.timezone,hour:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(now)
    const hour=Number(parts.find(p=>p.type==='hour')?.value),day=parts.find(p=>p.type==='weekday')?.value
    if(hour<9||hour>=18||day==='Sun'||day==='Sat')continue
    simulated+=Number(this.db.prepare("UPDATE campaign_recipients SET status='simulated',processed_at=? WHERE tenant=? AND id=? AND status='pending'").run(stamp,tenant,row.id).changes)
   }
   this.db.exec('COMMIT');return {mode:'simulation',simulated,sent:0}
  }catch(error){this.db.exec('ROLLBACK');throw error}
 }
}
const globalCampaign=globalThis as typeof globalThis & {campaignStore?:CampaignStore}
export function getCampaignStore(){return globalCampaign.campaignStore??=new CampaignStore(process.env.PRACTICE_CAMPAIGN_DB||path.join(practiceAgentDir(),'campaigns.sqlite'))}

