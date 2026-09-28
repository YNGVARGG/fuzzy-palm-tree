import { campaignWorkflowAccess, getCampaignStore } from "@/lib/campaign-store"
export async function POST(req:Request){
 const tenant=process.env.CAMPAIGN_WORKFLOW_TENANT||''
 if(!campaignWorkflowAccess(req.headers.get('authorization'),tenant))return Response.json({error:'Unauthorized'},{status:401})
 // The workflow receives counts only. It cannot choose a tenant or access patient records.
 return Response.json(getCampaignStore().simulate(tenant),{headers:{'Cache-Control':'no-store'}})
}
