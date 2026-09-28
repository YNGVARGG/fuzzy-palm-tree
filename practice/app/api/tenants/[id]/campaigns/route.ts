import { withAccess } from "@/lib/route-access"
import { getCampaignStore } from "@/lib/campaign-store"
import { readTenant } from "@/lib/server-data"
type Context={params:Promise<{id:string}>}
export const GET=withAccess(async(req:Request,{params}:Context)=>{
 const {id}=await params;readTenant(id)
 const campaign=new URL(req.url).searchParams.get('campaign')
 try{return Response.json(campaign?{recipients:getCampaignStore().recipients(id,campaign)}:{campaigns:getCampaignStore().list(id),mode:'simulation'})}catch{return Response.json({error:'Campagne introuvable'},{status:404})}
})
export const POST=withAccess(async(req:Request,{params}:Context)=>{
 const {id}=await params;readTenant(id)
 try{
  if(Number(req.headers.get('content-length'))>10000)return Response.json({error:'Requête trop grande'},{status:413})
  const text=await req.text();if(text.length>10000)throw new Error('Requête trop grande')
  const input=JSON.parse(text);if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Requête invalide')
  const store=getCampaignStore();const campaign=typeof input.campaign==='string'?input.campaign:''
  if(input.action==='create')return Response.json({id:store.create(id,input)},{status:201})
  if(input.action==='add')store.add(id,campaign,input)
  else if(input.action==='status')store.status(id,campaign,input.status)
  else if(input.action==='suppress')store.suppress(id,campaign,String(input.recipient||''))
  else if(input.action==='simulate')return Response.json(store.simulate(id))
  else throw new Error('Action invalide')
  return Response.json({ok:true})
 }catch(error){return Response.json({error:error instanceof Error?error.message:'Requête invalide'},{status:400})}
})
