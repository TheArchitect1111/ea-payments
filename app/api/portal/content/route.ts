import { NextRequest } from 'next/server';
import { guardPortalApi,portalApiUnauthorized,portalTenant } from '@/lib/api/portal-route';
import { ContentKind,readContent,saveContent,finishReport,generateReport,listContent } from '@/lib/bricks/content-family';
import { portalContentDefault } from '@/lib/bricks/content-portal';
import { z } from 'zod';
export async function GET(req:NextRequest){
 const auth=await guardPortalApi(req,{realm:'portal'});if(!auth.ok)return portalApiUnauthorized(auth);
 const slug=portalTenant(auth.session).portalSlug,kind=ContentKind.safeParse(req.nextUrl.searchParams.get('kind'));
 if(!kind.success)return Response.json({error:'Invalid content module'},{status:400});
 const initial=await portalContentDefault(slug,kind.data);
 if(!initial)return Response.json({error:'Module not installed'},{status:404});
 const org=initial.organizationId,role=['staff','admin','owner'].includes(auth.session.role)?'staff':'member';
 const key=req.nextUrl.searchParams.get('key')||initial.key;
 try{if(req.nextUrl.searchParams.get('list')==='1')return Response.json({ok:true,items:await listContent({organizationId:org,portalSlug:slug},kind.data,role)});
 return Response.json({ok:true,content:await readContent({organizationId:org,portalSlug:slug},kind.data,key,role)}); }
 catch{return Response.json({error:'Content unavailable'},{status:404});}
}
export async function POST(req:NextRequest){
 const auth=await guardPortalApi(req,{realm:'portal'});if(!auth.ok)return portalApiUnauthorized(auth);
 if(!['staff','admin','owner'].includes(auth.session.role))return Response.json({error:'Staff only'},{status:403});
 const slug=portalTenant(auth.session).portalSlug;
 const parsed=z.object({kind:ContentKind,action:z.enum(['save','finish','generate']),key:z.string(),
   title:z.string().optional(),visibility:z.enum(['staff','member']).optional(),
   body:z.string().optional(),source:z.string().optional(),mediaType:z.string().optional(),artifact:z.string().optional(),sourceKind:z.enum(['documents','resources']).optional()}).strict().safeParse(await req.json());
 if(!parsed.success)return Response.json({error:'Invalid content record'},{status:400});
 const input=parsed.data,existing=await portalContentDefault(slug,input.kind);
 if(!existing)return Response.json({error:'Module not installed'},{status:404});
 const tenant={organizationId:existing.organizationId,portalSlug:slug};
 try{const result=input.action==='generate'&&input.kind==='reports'
   ?await generateReport(tenant,input.key,input.sourceKind||'documents','staff')
   :input.action==='finish'&&input.kind==='reports'
   ?await finishReport(tenant,input.key,input.artifact||'','staff')
   :await saveContent(tenant,input.kind,{key:input.key,title:input.title,
       visibility:input.visibility,body:input.body,source:input.source,mediaType:input.mediaType},'staff');
 return Response.json({ok:true,content:result});}
 catch(e){return Response.json({error:e instanceof Error?e.message:'Content failed'},{status:400});}
}
