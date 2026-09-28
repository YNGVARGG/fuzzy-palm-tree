import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { encode } from 'next-auth/jwt'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
// Run after pnpm build. PLAYWRIGHT_MODULE may point to a bundled Playwright module.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'practice-layout-'))
const secret=randomBytes(48).toString('hex'), base='http://localhost:3182'
fs.mkdirSync(path.join(fixture,'tenants','dental'),{recursive:true})
fs.writeFileSync(path.join(fixture,'tenants','dental','tenant.json'),JSON.stringify({id:'dental',name:'Cabinet de démonstration',services:['Consultation'],language:'fr'}))
fs.writeFileSync(path.join(fixture,'auth-memberships.json'),JSON.stringify([{provider:'google',providerAccountId:'fixture-owner',tenantId:'dental',role:'owner'}]))
fs.mkdirSync(path.join(fixture,'tenants','dental','docs'),{recursive:true})
fs.writeFileSync(path.join(fixture,'tenants','dental','docs','tarifs.txt'),'Informations synthétiques de test.')
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3182'],{windowsHide:true,stdio:'ignore',env:{...process.env,NODE_ENV:'production',PRACTICE_AGENT_DIR:fixture,PRACTICE_AUTH_MEMBERSHIPS_FILE:path.join(fixture,'auth-memberships.json'),AUTH_SECRET:secret,AUTH_URL:'https://localhost:3182',AUTH_GOOGLE_ID:'fixture',AUTH_GOOGLE_SECRET:'fixture',AUTH_APPLE_ID:'',AUTH_APPLE_SECRET:'',AUTH_RESEND_KEY:'',AUTH_EMAIL_FROM:'',AGENT_URL:'http://127.0.0.1:1'}})
let browser
try {
 for(let i=0;i<80;i++){try{await fetch(base+'/login');break}catch{}await new Promise(r=>setTimeout(r,250))}
 browser=await chromium.launch({headless:true})
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'fr-FR'})
 await context.addCookies([{name:'__Secure-authjs.session-token',value:await encode({token:{identity:{provider:'google',providerAccountId:'fixture-owner',email:null}},secret,salt:'__Secure-authjs.session-token',maxAge:600}),domain:'localhost',path:'/',httpOnly:true,secure:true,sameSite:'Lax'}])
 await context.addInitScript(()=>localStorage.setItem('practice-demo','1'))
 const page=await context.newPage(), errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 const output=path.resolve('artifacts/layout-review');fs.mkdirSync(output,{recursive:true})
 for(const route of ['/','/inbox','/calls','/bookings','/documents','/performance','/campaigns']){
  await page.goto(base+route);await page.waitForSelector('h1');await page.waitForTimeout(700)
  assert.ok(!page.url().includes('/login'),'fixture session accepted')
  if(route==='/inbox'){
   const item=page.locator('button[aria-pressed]').filter({has:page.locator('span.font-semibold')}).first()
   if(await item.count()){await item.click();await page.getByRole('heading',{name:'Traiter la demande'}).waitFor()}
  }
  if(route==='/bookings'){await page.getByRole('button',{name:'Tous',exact:true}).click();await page.waitForTimeout(200);assert.ok(await page.locator('section[aria-label]').count()>0,'appointments grouped by date')}
  if(route==='/documents'){await page.getByRole('textbox',{name:'Rechercher un document'}).fill('absent');await page.getByText('Aucun document ne correspond à cette recherche.').waitFor();await page.getByRole('textbox',{name:'Rechercher un document'}).fill('')}
  if(route==='/campaigns'){await page.getByRole('textbox',{name:'Message',exact:true}).fill('Rappel de démonstration {date}');await page.getByText('Rappel de démonstration {date}',{exact:true}).last().waitFor()}
  const name=route==='/'?'overview':route.slice(1)
  await page.screenshot({path:path.join(output,name+'.png'),fullPage:true})
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' mobile overflow')
  await page.screenshot({path:path.join(output,name+'-mobile.png'),fullPage:true})
  await page.setViewportSize({width:1440,height:1000})
  console.log(name+' desktop/mobile rendered')
 }
 await page.getByRole('button',{name:'Basculer le thème'}).click();await page.screenshot({path:path.join(output,'campaigns-dark.png'),fullPage:true})
 assert.deepEqual(errors,[])
 console.log('Layout checks passed; screenshots in '+output)
} finally {
 if(browser)await browser.close()
 child.kill()
 await new Promise(r=>child.once('exit',r))
 if(path.dirname(fixture)===os.tmpdir()&&path.basename(fixture).startsWith('practice-layout-'))fs.rmSync(fixture,{recursive:true,force:true})
}

