// Synthetic callback tests; no messages sent and no email-service network access.
import { spawn } from 'node:child_process'
import { randomBytes, createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { EmailAuthStore } from '../lib/email-auth.ts'
const root=fs.mkdtempSync(path.join(os.tmpdir(),'email-http-'))
const secret=randomBytes(48).toString('hex'), port=3180,base=`http://localhost:${port}`,origin=`https://localhost:${port}`
const email='invited@example.com', membership=path.join(root,'auth-memberships.json')
fs.mkdirSync(path.join(root,'tenants','dental'),{recursive:true})
fs.writeFileSync(path.join(root,'tenants','dental','tenant.json'),JSON.stringify({id:'dental',name:'Fixture',services:[]}))
fs.writeFileSync(membership,JSON.stringify([{provider:'email',email,tenantId:'dental',role:'owner'}]))
const store=new EmailAuthStore(path.join(root,'email-auth.sqlite'))
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{windowsHide:true,stdio:'ignore',env:{...process.env,NODE_ENV:'production',PRACTICE_AGENT_DIR:root,PRACTICE_AUTH_MEMBERSHIPS_FILE:membership,PRACTICE_AUTH_DB:path.join(root,'email-auth.sqlite'),AUTH_SECRET:secret,AUTH_URL:origin,AUTH_RESEND_KEY:'fixture-never-sent',AUTH_EMAIL_FROM:'fixture@example.com'}})
async function tokenFor(address,expires=new Date(Date.now()+60000)){
 const token=randomBytes(32).toString('hex')
 await store.adapter().createVerificationToken({identifier:address,token:createHash('sha256').update(token+secret).digest('hex'),expires})
 return `${base}/api/auth/callback/email?${new URLSearchParams({token,email:address,callbackUrl:origin+'/'})}`
}
try {
 for(let i=0;i<80;i++){try{await fetch(base+'/login');break}catch{}await new Promise(r=>setTimeout(r,250))}
 const providers=await(await fetch(base+'/api/auth/providers')).json()
 assert.ok(providers.email,'email provider available')
 const valid=await tokenFor(email)
 const response=await fetch(valid,{redirect:'manual'})
 const cookies=response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')
 assert.ok(cookies.includes('__Secure-authjs.session-token='),'verified callback must create session')
 assert.equal((await fetch(base+'/api/tenants',{headers:{cookie:cookies}})).status,200)
 // Sign out through Auth.js, then sign in again as an existing verified user.
 const csrfResponse=await fetch(base+'/api/auth/csrf',{headers:{cookie:cookies}})
 const csrf=(await csrfResponse.json()).csrfToken
 const csrfCookies=csrfResponse.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')
 const logout=await fetch(base+'/api/auth/signout',{method:'POST',redirect:'manual',headers:{cookie:cookies+'; '+csrfCookies,origin,'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1'},body:new URLSearchParams({csrfToken:csrf,callbackUrl:origin+'/login'})})
 assert.ok(logout.headers.getSetCookie().some(c=>c.startsWith('__Secure-authjs.session-token=;')),'logout clears the session cookie')
 const again=await fetch(await tokenFor(email),{redirect:'manual'})
 const againCookie=again.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')
 assert.ok(againCookie.includes('__Secure-authjs.session-token='),'existing user can sign back in with a fresh link')
 assert.equal((await fetch(base+'/api/tenants',{headers:{cookie:againCookie}})).status,200)
 // Pre-fill the limiter so no real email request can leave this test.
 for(let i=0;i<3;i++)store.allowRequest(email)
 const limited=await fetch(base+'/api/auth/signin/email',{method:'POST',redirect:'manual',headers:{cookie:cookies+'; '+csrfCookies,origin,'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1'},body:new URLSearchParams({csrfToken:csrf,email,callbackUrl:origin+'/'})})
 assert.equal(new URL((await limited.json()).url).searchParams.get('retry'),'1','throttled request must explain that no new email was sent')
 const replay=await fetch(valid,{redirect:'manual'})
 assert.ok(!replay.headers.getSetCookie().some(c=>c.startsWith('__Secure-authjs.session-token=')&&!c.startsWith('__Secure-authjs.session-token=;')),'replay must not create session')
 for(const link of [await tokenFor(email,new Date(Date.now()-1000)),await tokenFor('uninvited@example.com')]){
  const denied=await fetch(link,{redirect:'manual'})
  assert.ok(denied.headers.get('location')?.includes('error='),'expired/uninvited denied')
 }
 fs.writeFileSync(membership,'[]')
 assert.equal((await fetch(base+'/api/tenants',{headers:{cookie:cookies}})).status,401)
 const revoked=await fetch(await tokenFor(email),{redirect:'manual'})
 assert.ok(revoked.headers.get('location')?.includes('error='))
 console.log('Email HTTP passed: verified callback grants clinic session; replay, expired, uninvited and revoked identities denied. No live emails sent.')
} catch(e){console.error(e.message);process.exitCode=1}
finally {child.kill();await new Promise(r=>child.once('exit',r));store.close();fs.rmSync(root,{recursive:true,force:true})}

