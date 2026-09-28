import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { CampaignStore, campaignWorkflowAccess } from '../lib/campaign-store.ts'
test('campaign simulation: practice isolation, duplicate suppression, approval, contact withdrawal, quiet hours and replay',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'campaign-test-'));const store=new CampaignStore(path.join(root,'store.sqlite'))
 const monday=Date.parse('2030-01-07T10:00:00Z')
 try{
  const id=store.create('dental',{name:'Reminder'})
  const data={phone:'+33123456789',appointmentAt:'2030-01-08T10:00:00Z',dueAt:'2030-01-07T10:00:00Z',contactAllowed:true}
  assert.throws(()=>store.add('other',id,data,monday))
  assert.throws(()=>store.add('dental',id,{...data,contactAllowed:false},monday))
  store.add('dental',id,data,monday)
  assert.throws(()=>store.add('dental',id,data,monday))
  assert.equal(store.simulate('dental',monday).simulated,0,'draft is never processed')
  store.status('dental',id,'ready')
  assert.equal(store.simulate('other',monday).simulated,0)
  assert.equal(store.simulate('dental',monday).simulated,1)
  assert.equal(store.simulate('dental',monday).simulated,0,'repeated webhook cannot duplicate a reminder')
  assert.equal(store.list('dental')[0].simulated,1)
  const next=store.create('dental',{name:'Withdrawn'})
  store.add('dental',next,{...data,phone:'+33123456780'},monday)
  store.status('dental',next,'ready')
  store.suppress('dental',next,store.recipients('dental',next)[0].id)
  assert.equal(store.simulate('dental',monday).simulated,0)
  const late=store.create('dental',{name:'Quiet hours'})
  store.add('dental',late,{...data,phone:'+33123456781',dueAt:'2030-01-07T20:00:00Z'},monday)
  store.status('dental',late,'ready')
  assert.equal(store.simulate('dental',Date.parse('2030-01-07T20:00:00Z')).simulated,0)
  assert.equal(store.simulate('dental',Date.parse('2030-01-08T10:00:00Z')).simulated,0,'expired appointments excluded')
  assert.equal(store.list('other').length,0)
  assert.equal(campaignWorkflowAccess(null,'dental'),false)
 }finally{store.close();fs.rmSync(root,{recursive:true,force:true})}
})
