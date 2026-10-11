import { NextRequest } from 'next/server';
import { z } from 'zod';
import { provisionTestsAllowed } from '@/lib/bricks/provision-test';
import { requireAdminActionFromRequest, adminAuthJsonError } from '@/lib/admin-session-guard';
import { ensureTenantFoundation } from '@/lib/tenant-foundation';
import { CaptureKind,submitCapture,progressCapture } from '@/lib/bricks/capture-family';
export async function GET(){return Response.json({error:'Not found'},{status:404});}
export async function POST(request:NextRequest){
 if(!provisionTestsAllowed())return Response.json({error:'Not found'},{status:404});
 const auth=await requireAdminActionFromRequest(request,'admin:manage');
 if(!auth.ok)return adminAuthJsonError(auth);
 try{
  const {runId,kind}=z.object({runId:z.string().regex(/^[a-z0-9-]{8,40}$/),kind:CaptureKind}).strict().parse(await request.json());
  const portalSlug='cert-'+kind+'-'+runId;
  const {orgId}=await ensureTenantFoundation({portalSlug,clientName:'Capture certification',packagePurchased:'Launch Verification',requestedModuleIds:[kind],assemblyMode:'certified'});
  const tenant={organizationId:orgId,portalSlug};
  const data={identity:'contact-'+runId,requestId:runId,email:'contact@certification.invalid',name:'Preview Fixture',payload:{intent:'certification'}};
  const first=await submitCapture(tenant,kind,data);
  const replay=await submitCapture(tenant,kind,data);
  let confirms=0;
  const ports={confirm:async()=>{confirms++}};
  const done=await progressCapture(tenant,kind,data.identity,ports);
  await progressCapture(tenant,kind,data.identity,ports);
  if(first.id!==replay.id||done.state===first.state||confirms!==(kind==='applications'?1:0))throw Error('Capture lifecycle replay failed');
  return Response.json({ok:true,testOnly:true,kind,recordId:first.id,outcome:done.outcome,confirmationCount:confirms,productionTestRouteStatus:404});
 }catch(e){return Response.json({ok:false,error:e instanceof Error?e.message:'Failed'},{status:503});}
}
