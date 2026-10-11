import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminActionFromRequest, adminAuthJsonError } from '@/lib/admin-session-guard';
import { provisionTestsAllowed } from '@/lib/bricks/provision-test';
import { ensureTenantFoundation } from '@/lib/tenant-foundation';
import { ContentKind,contentDefaults,saveContent,readContent,generateReport } from '@/lib/bricks/content-family';
export async function GET(){return Response.json({error:'Not found'},{status:404});}
export async function POST(request:NextRequest){
 if(!provisionTestsAllowed())return Response.json({error:'Not found'},{status:404});
 const auth=await requireAdminActionFromRequest(request,'admin:manage');
 if(!auth.ok)return adminAuthJsonError(auth);
 try{
  const {runId,kind}=z.object({runId:z.string().regex(/^[a-z0-9-]{8,40}$/),kind:ContentKind}).strict().parse(await request.json());
  const portalSlug='cert-'+kind+'-'+runId;
  const {orgId}=await ensureTenantFoundation({portalSlug,clientName:'Content certification',
    packagePurchased:'Launch Verification',requestedModuleIds:kind==='reports'?['reports','documents']:[kind],assemblyMode:'certified'});
  const tenant={organizationId:orgId,portalSlug};
  const initial=await contentDefaults(tenant,kind),repeat=await contentDefaults(tenant,kind);
  if(initial.id!==repeat.id)throw Error('Defaults replay mismatch');
  const input={key:'fixture',title:'Example',visibility:'staff' as const,
    ...(kind==='documents'||kind==='resources'?{source:'/portal/'+portalSlug+'/documents/fixture'}:{})};
  const saved=await saveContent(tenant,kind,input,'staff');
  const again=await saveContent(tenant,kind,input,'staff');
  if(saved.id!==again.id)throw Error('Capture replay mismatch');
  try{await readContent(tenant,kind,'fixture','member');throw Error('ACL not enforced');}catch(e){
    if((e as Error).message!=='Content access denied')throw e;
  }
  const readback=await readContent(tenant,kind,'fixture','staff');
  try{await readContent({...tenant,portalSlug:portalSlug+'-other'},kind,'fixture','staff');
    throw Error('Cross-tenant read was accepted');}catch(e){
    if((e as Error).message==='Cross-tenant read was accepted')throw e;
  }
  if(kind==='reports')await contentDefaults(tenant,'documents');
  const job=kind==='reports'?await generateReport(tenant,'fixture','documents','staff'):null;
  if(job && (job.state!=='complete'||!job.body))throw Error('Report generation did not persist an artifact');
  return Response.json({ok:true,testOnly:true,kind,readbackId:readback.id,reportState:job?.state||null,productionStatus:404});
 }catch(e){return Response.json({ok:false,error:e instanceof Error?e.message:'Failed'},{status:503});}
}
