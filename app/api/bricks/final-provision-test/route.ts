import {NextRequest} from 'next/server';
import {z} from 'zod';
import {requireAdminActionFromRequest,adminAuthJsonError} from '@/lib/admin-session-guard';
import {provisionTestsAllowed} from '@/lib/bricks/provision-test';
import {ensureTenantFoundation} from '@/lib/tenant-foundation';
import {FinalKind,saveFinal,readFinal,transitionFinal,finalDefaults,listFinal} from '@/lib/bricks/final-family';
export async function GET(){return Response.json({error:'Not found'},{status:404});}
export async function POST(req:NextRequest){
 if(!provisionTestsAllowed())return Response.json({error:'Not found'},{status:404});
 const auth=await requireAdminActionFromRequest(req,'admin:manage');
 if(!auth.ok)return adminAuthJsonError(auth);
 try{
 const {runId,kind}=z.object({runId:z.string().regex(/^[a-z0-9-]{8,40}$/),kind:FinalKind}).strict().parse(await req.json());
 const portalSlug='cert-'+kind+'-'+runId;
 const {orgId}=await ensureTenantFoundation({portalSlug,clientName:'Final module certification',
 packagePurchased:'Launch Verification',requestedModuleIds:[kind],assemblyMode:'certified'});
 const tenant={organizationId:orgId,portalSlug};
 const def=await finalDefaults(tenant,kind),replayDefault=await finalDefaults(tenant,kind);
 if(def.id!==replayDefault.id)throw Error('Default replay failure');
 const input={key:'test-'+runId,title:'Fixture',body:'Proven lifecycle',
 visibility:'member' as const,state:'draft' as const};
 const first=await saveFinal(tenant,kind,input,'staff'),second=await saveFinal(tenant,kind,input,'staff');
 if(first.id!==second.id)throw Error('Business identity replay failure');
 const states:Record<string,{state:'ready'|'delivered'|'responded'|'published'|'enrolled'|'completed';reply?:string;progress?:number}>={
 pulse:{state:'delivered'},amplifi:{state:'published'},'update-hub':{state:'responded',reply:'Received'},
 messaging:{state:'responded',reply:'Received'},training:{state:'completed',progress:100},
 landing:{state:'published'},ask:{state:'responded',reply:'Received'},settings:{state:'ready'},ctp:{state:'completed'}};
 const action=states[kind];const third=await transitionFinal(tenant,kind,input.key,action,'staff');
 const fourth=await transitionFinal(tenant,kind,input.key,action,'staff');
 if(JSON.stringify(third)!==JSON.stringify(fourth))throw Error('Transition replay failure');
 const rows=await listFinal(tenant,kind,'member');
 if(!rows.some(x=>x.id===third.id))throw Error('Tenant list readback missing');
 try{await readFinal({...tenant,portalSlug:'another-tenant'},kind,input.key,'staff');
 throw Error('Cross tenant read succeeded');}catch(e){if((e as Error).message==='Cross tenant read succeeded')throw e;}
 return Response.json({ok:true,testOnly:true,moduleId:kind,tenant,recordId:third.id,state:third.state,
  authorizedReadback:true,tenantIsolation:true,replay:true,productionStatus:404});
 }catch(e){return Response.json({ok:false,error:e instanceof Error?e.message:'Failed'},{status:503});}
}