// Run after pnpm build. Uses isolated synthetic data and signed fixture sessions.
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { encode } from 'next-auth/jwt'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=fs.mkdtempSync(path.join(os.tmpdir(),'practice-auth-http-'))
const secret=randomBytes(48).toString('hex')
const port=3179, origin=`https://localhost:${port}`, base=`http://localhost:${port}`
for(const id of ['dental','other']){fs.mkdirSync(path.join(root,'tenants',id),{recursive:true});fs.writeFileSync(path.join(root,'tenants',id,'tenant.json'),JSON.stringify({id,name:id,services:['Consultation'],public_booking_enabled:id==='dental'}))}
fs.writeFileSync(path.join(root,'auth-memberships.json'),JSON.stringify([{provider:'google',providerAccountId:'owner',tenantId:'dental',role:'owner'},{provider:'google',providerAccountId:'viewer',tenantId:'dental',role:'viewer'}]))
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,NODE_ENV:'production',PRACTICE_AGENT_DIR:root,PRACTICE_AUTH_MEMBERSHIPS_FILE:path.join(root,'auth-memberships.json'),AUTH_SECRET:secret,AUTH_URL:origin,AUTH_GOOGLE_ID:'fixture',AUTH_GOOGLE_SECRET:'fixture',AUTH_APPLE_ID:'',AUTH_APPLE_SECRET:'',AUTH_RESEND_KEY:'',AUTH_EMAIL_FROM:'',CAMPAIGN_WORKFLOW_TOKEN:'',CAMPAIGN_WORKFLOW_TENANT:''}})
let logs='';child.stdout.on('data',x=>logs+=x);child.stderr.on('data',x=>logs+=x)
const cookie=async(id)=>`__Secure-authjs.session-token=${await encode({token:{identity:{provider:'google',providerAccountId:id,email:null}},secret,salt:'__Secure-authjs.session-token',maxAge:3600})}`
try {
 for(let i=0;i<80;i++){try{await fetch(base+'/login');break}catch{}await new Promise(r=>setTimeout(r,250))}
 const owner=await cookie('owner'), viewer=await cookie('viewer')
 const paths=['/api/tenants','/api/tenants/dental','/api/tenants/dental/calls','/api/tenants/dental/calls/2026-09-01_10-00-00/audio','/api/tenants/dental/documents','/api/tenants/dental/export','/api/config/calendar']
 for(const p of paths)assert.equal((await fetch(base+p)).status,401,p)
 assert.equal((await fetch(base+'/',{redirect:'manual'})).status,307)
 const listed=await fetch(base+'/api/tenants',{headers:{cookie:owner}})
 assert.equal(listed.status,200,await listed.clone().text())
 assert.deepEqual((await listed.json()).tenants.map(t=>t.id),['dental'])
 assert.equal((await fetch(base+'/api/tenants/other',{headers:{cookie:owner}})).status,403)
 assert.equal((await fetch(base+'/api/workflows/campaigns',{method:'POST'})).status,401)
 assert.equal((await fetch(base+'/api/tenants/other/campaigns',{headers:{cookie:owner}})).status,403)
 assert.equal((await fetch(base+'/api/tenants/dental/campaigns',{method:'POST',headers:{cookie:viewer,origin,'Content-Type':'application/json'},body:JSON.stringify({action:'create',name:'Fixture reminder'})})).status,403)
 const draft=await fetch(base+'/api/tenants/dental/campaigns',{method:'POST',headers:{cookie:owner,origin,'Content-Type':'application/json'},body:JSON.stringify({action:'create',name:'Fixture reminder'})})
 assert.equal(draft.status,201)
 assert.equal((await fetch(base+'/api/tenants/dental',{method:'PUT',headers:{cookie:viewer,origin,'Content-Type':'application/json'},body:'{}'})).status,403)
 assert.equal((await fetch(base+'/api/tenants/dental/tasks',{method:'POST',headers:{cookie:owner,origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403)
 assert.equal((await fetch(base+'/api/tenants/dental',{headers:{cookie:'__Secure-authjs.session-token=forged'}})).status,401)
 assert.equal((await fetch(base+'/api/public/practices/other')).status,404)
 const publicData=await(await fetch(base+'/api/public/practices/dental')).json();assert.deepEqual(Object.keys(publicData).sort(),['id','name','services'])
 const scheduled=await fetch(base+'/api/schedule',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({practice:'dental',name:'Fixture',phone:'+33123456789',service:'Consultation',date:new Date(Date.now()+86400000).toISOString().slice(0,10),time:'10:00'})})
 assert.equal(scheduled.status,201);assert.equal((await scheduled.json()).confirmed,false)
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'call-activity.jsonl'),'utf8')).kind,'message_taken')
 fs.writeFileSync(path.join(root,'auth-memberships.json'),'[]')
 assert.equal((await fetch(base+'/api/tenants',{headers:{cookie:owner}})).status,401)
 console.log('HTTP checks passed: unauthenticated/forged/cross-practice/role/CSRF/revoked access denied; one practice returned; public requests remain unconfirmed.')
} catch(e){console.error('Security test failed:',e.message);process.exitCode=1}
finally {child.kill();await new Promise(r=>child.once('exit',r));if(path.dirname(root)===os.tmpdir()&&path.basename(root).startsWith('practice-auth-http-'))fs.rmSync(root,{recursive:true,force:true})}
