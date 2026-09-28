import { withAccess } from "@/lib/route-access"
import { getStore,readTenant } from "@/lib/server-data"
import { apiError,parseQuery } from "@/lib/api-query"

async function GETImpl(req:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const {id}=await params;readTenant(id)
    const query=parseQuery(req)
    const store=getStore();await store.syncEvents()
    const iterator=store.bookingExport(id,query)
    const encoder=new TextEncoder()
    const field=(value:unknown)=>{let s=String(value??"");if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
    const body=new ReadableStream({
      start(controller){controller.enqueue(encoder.encode('\uFEFFreference,date,heure,soin,patient,telephone,pris_le\n'))},
      pull(controller){
        let chunk=""
        for(let i=0;i<100;i++){
          const row=iterator.next()
          if(row.done){if(chunk)controller.enqueue(encoder.encode(chunk));controller.close();return}
          const b=JSON.parse(String(row.value.payload))
          chunk += [b.reference,b.date,b.time,b.service,b.customer_name,b.phone,b.at].map(field).join(',')+'\n'
        }
        controller.enqueue(encoder.encode(chunk))
      },
      cancel(){iterator.return?.()}
    })
    return new Response(body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="rendez-vous.csv"',"Cache-Control":"no-store"}})
  }catch(error){return apiError(error)}
}

export const GET = withAccess(GETImpl)
