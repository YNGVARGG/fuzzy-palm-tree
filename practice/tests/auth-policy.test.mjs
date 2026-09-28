import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { isTrustedMutationOrigin, roleAtLeast } from '../lib/auth-policy.ts'
import { resolveMembership } from '../lib/auth-memberships.ts'
import { makeScheduleRequest } from '../lib/schedule-request.ts'

test('membership is explicit, provider-bound, revocable and single-business',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'practice-access-'))
 const old=process.env.PRACTICE_AGENT_DIR
 process.env.PRACTICE_AGENT_DIR=root
 const env={AUTH_GOOGLE_ID:'fixture',AUTH_GOOGLE_SECRET:'fixture',AUTH_APPLE_ID:'fixture',AUTH_APPLE_SECRET:'fixture'}
 const identity={provider:'google',providerAccountId:'123',email:'owner@example.test'}
 const file=path.join(root,'auth-memberships.json')
 try {
  for(const id of ['dental','other']){fs.mkdirSync(path.join(root,'tenants',id),{recursive:true});fs.writeFileSync(path.join(root,'tenants',id,'tenant.json'),'{}')}
  assert.equal(resolveMembership(identity,env),null)
  const member={provider:'google',providerAccountId:'123',tenantId:'dental',role:'owner'}
  fs.writeFileSync(file,JSON.stringify([member]))
  assert.deepEqual(resolveMembership(identity,env),{tenantId:'dental',role:'owner'})
  assert.equal(resolveMembership({...identity,provider:'apple'},env),null)
  assert.equal(resolveMembership({...identity,providerAccountId:'attacker'},env),null)
  fs.writeFileSync(file,JSON.stringify([member,{...member,tenantId:'other'}]))
  assert.equal(resolveMembership(identity,env),null)
  fs.writeFileSync(file,'[]');assert.equal(resolveMembership(identity,env),null)
 } finally { if(old===undefined)delete process.env.PRACTICE_AGENT_DIR;else process.env.PRACTICE_AGENT_DIR=old;fs.rmSync(root,{recursive:true}) }
})
test('unsafe origins and viewer mutations denied',()=>{
 const env={NODE_ENV:'production',AUTH_URL:'https://clinic.example'}
 assert.equal(isTrustedMutationOrigin(new Request('https://clinic.example/api',{method:'POST',headers:{origin:'https://evil.example','x-forwarded-host':'evil.example'}}),env),false)
 assert.equal(isTrustedMutationOrigin(new Request('https://clinic.example/api',{method:'POST'}),env),false)
 assert.equal(isTrustedMutationOrigin(new Request('https://clinic.example/api',{method:'POST',headers:{origin:'https://clinic.example'}}),env),true)
 assert.equal(roleAtLeast('viewer','staff'),false)
 assert.equal(roleAtLeast('staff','admin'),false)
})
test('online requests remain unconfirmed tasks and validate date, time and service',()=>{
 const input={name:'Test Patient',phone:'+33123456789',service:'Consultation',date:'2026-10-15',time:'10:30'}
 const now=new Date('2026-09-06T12:00:00Z')
 const event=makeScheduleRequest(input,['Consultation'],now)
 assert.equal(event.kind,'message_taken');assert.equal(event.status,'open')
 assert.notEqual(event.reference,makeScheduleRequest(input,['Consultation'],now).reference)
 for(const changes of [{date:'2026-02-30'},{time:'25:00'},{date:'2020-01-01'},{service:'invalid'},{phone:'x'}])assert.throws(()=>makeScheduleRequest({...input,...changes},['Consultation'],now))
})
