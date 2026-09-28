import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EmailAuthStore, validLoginEmail } from '../lib/email-auth.ts'

test('email token expiry, identity binding, atomic consumption and durable limits', async () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'email-auth-test-'))
 const file=path.join(root,'auth.sqlite'); const store=new EmailAuthStore(file); const adapter=store.adapter()
 try {
  const value={identifier:'owner@example.com',token:'hashed-fixture',expires:new Date(Date.now()+60000)}
  await adapter.createVerificationToken(value)
  assert.equal(await adapter.useVerificationToken({...value,identifier:'wrong@example.com'}),null)
  assert.equal((await adapter.useVerificationToken(value)).identifier,value.identifier)
  assert.equal(await adapter.useVerificationToken(value),null)
  await adapter.createVerificationToken({...value,token:'expired',expires:new Date(Date.now()-1)})
  assert.equal(await adapter.useVerificationToken({...value,token:'expired'}),null)
  assert.equal(store.allowRequest(value.identifier),true)
  assert.equal(store.allowRequest(value.identifier),true)
  assert.equal(store.allowRequest(value.identifier),true)
  const second=new EmailAuthStore(file)
  try {assert.equal(second.allowRequest(value.identifier),false)} finally {second.close()}
  assert.equal(store.allowRequest(value.identifier,Date.now()+16*60000),true)
  assert.equal(validLoginEmail(' Owner@Example.com '),'owner@example.com')
  for(const bad of ['one@example.com,two@example.com','"bad"@example.com','bad\r\n@example.com','bad@@example.com','not-an-email'])assert.equal(validLoginEmail(bad),null)
 } finally {store.close();fs.rmSync(root,{recursive:true,force:true})}
})
