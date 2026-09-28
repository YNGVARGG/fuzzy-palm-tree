import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { PracticeStore, ConflictError } from '../lib/practice-store.ts'

test('indexed history, task persistence, pagination, isolation and append recovery', async () => {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'practice-store-test-'))
  let store
  const database=path.join(root,'practice.sqlite')
  try {
    const events=Array.from({length:10000},(_,i)=>({tenant:i%2?'beta':'alpha',kind:i%7===0?'escalation':i%3===0?'message_taken':'appointment_booked',at:`2026-09-05T${String(i%24).padStart(2,'0')}:00:${String(i%60).padStart(2,'0')}.000Z`,customer_name:`Synthetic Patient ${i}`,phone:`+330${i}`,reference:String(i),message:'Synthetic request',date:'2026-09-10'}))
    const log=path.join(root,'call-activity.jsonl')
    await fs.writeFile(log,events.map(e=>JSON.stringify(e)).join('\n')+'\n')
    const callIds=[]
    for(let i=0;i<260;i++) {
      const id=`2026-09-${String(1+Math.floor(i/24)).padStart(2,'0')}_${String(i%24).padStart(2,'0')}-00-00`
      callIds.push(id)
      const dir=path.join(root,'calls','alpha',id)
      await fs.mkdir(dir,{recursive:true})
      await fs.writeFile(path.join(dir,'summary.txt'),`Synthetic call ${i}`)
      await fs.writeFile(path.join(dir,'meta.json'),JSON.stringify({patient:`Synthetic Patient ${i}`,type:i%2?'question':'rdv'}))
      await fs.writeFile(path.join(dir,'transcript.json'),'[{"role":"user","content":"Synthetic only"}]')
    }
    store=new PracticeStore(root,database)
    await Promise.all([store.syncEvents(),store.syncEvents(),store.syncCalls('alpha')])
    assert.equal(store.calls('alpha').total,260)
    const first=store.calls('alpha',{page:1,limit:25})
    const last=store.calls('alpha',{page:11,limit:25})
    assert.equal(first.calls.length,25)
    assert.equal(last.calls.length,10)
    assert.equal(new Set([...first.calls,...last.calls].map(c=>c.id)).size,35)
    assert.equal(store.calls('beta').total,0)
    assert.equal(store.calls('alpha',{from:'2026-09-01',to:'2026-09-01'}).total,24)
    assert.equal(store.calls('alpha',{type:'rdv'}).total,130)
    assert.equal(store.calls('alpha',{q:'call 259'}).calls.length,1)
    assert.equal(store.activity('alpha','bookings',{q:'%'}).total,0)
    const expected=events.filter(e=>e.tenant==='alpha'&&e.kind==='appointment_booked').length
    assert.equal(store.activity('alpha','bookings').total,expected)
    assert.equal(store.summary('alpha',75).bookings,expected)
    assert.equal(store.summary('alpha',75).conversion,null)
    const tasks=store.activity('alpha','messages',{limit:100})
    const urgent=tasks.messages.find(t=>t.kind==='escalation')
    assert.ok(urgent)
    assert.equal(urgent.priority,'urgent')
    const input={id:urgent.id,status:'resolved',owner:'Reception A',priority:'urgent',due_at:'2026-09-06T12:00',notes:'Synthetic follow-up complete',version:0}
    assert.equal(store.updateTask('alpha',input).version,1)
    assert.throws(()=>store.updateTask('alpha',input),ConflictError)
    assert.throws(()=>store.updateTask('beta',input),/introuvable/)
    const originalOpen=tasks.total
    assert.equal(store.activity('alpha','messages',{status:'open'}).total,originalOpen-1)
    store.close()
    store=new PracticeStore(root,database)
    assert.equal(store.activity('alpha','messages',{status:'resolved'}).messages[0].notes,input.notes)
    let reads=0
    const originalRead=fs.readFile
    fs.readFile=async(...args)=>{reads++;return originalRead(...args)}
    try { await store.syncCalls('alpha') } finally { fs.readFile=originalRead }
    assert.equal(reads,0,'warm listing must not reopen historical call content')
    const appended={tenant:'alpha',kind:'message_taken',at:'2026-09-06T12:00:00Z',customer_name:'Synthetic appended'}
    const raw=JSON.stringify(appended)
    await fs.appendFile(log,raw.slice(0,20))
    await store.syncEvents()
    assert.equal(store.activity('alpha','messages').total,originalOpen)
    await fs.appendFile(log,raw.slice(20)+'\n')
    await store.syncEvents()
    assert.equal(store.activity('alpha','messages').total,originalOpen+1)
    // Log truncation/rewrite removes deleted source records and their staff notes.
    await fs.writeFile(log,JSON.stringify(appended)+'\n')
    await store.syncEvents()
    assert.equal(store.activity('alpha','messages').total,1)
    assert.equal(store.db.prepare('SELECT count(*) AS n FROM task_history').get().n,0)
    assert.equal(store.activity('alpha','bookings').total,0)
    store.forgetTenant('alpha')
    assert.equal(store.calls('alpha').total,0)
    console.log('Verified 10,000 events, 260 calls, bounded pages, warm content reads=0, durable task conflict handling and practice isolation.')
  } finally {
    store?.close()
    const resolved=path.resolve(root)
    const temp=path.resolve(os.tmpdir())+path.sep
    assert.ok(resolved.startsWith(temp)&&path.basename(resolved).startsWith('practice-store-test-'))
    await fs.rm(resolved,{recursive:true,force:true})
  }
})
