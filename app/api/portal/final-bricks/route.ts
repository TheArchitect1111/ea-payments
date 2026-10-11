import { NextRequest } from 'next/server';
import { z } from 'zod';
import { guardPortalApi,portalApiUnauthorized,portalTenant } from '@/lib/api/portal-route';
import { FinalKind,readFinal,listFinal,saveFinal,transitionFinal,generateFinal } from '@/lib/bricks/final-family';
import { portalFinalDefault } from '@/lib/bricks/final-portal';
import { listPublishedTrainingForTenant } from '@/lib/training-transformation-store';
import { findPublishedSitePage } from '@/lib/provision-website-portal';
import { brickHash } from '@/lib/bricks/durable';
async function context(req:NextRequest,kind:string){
 const a=await guardPortalApi(req,{realm:'portal'});if(!a.ok)return {error:portalApiUnauthorized(a)} as const;
 const k=FinalKind.safeParse(kind);if(!k.success)return {error:Response.json({error:'Invalid module'},{status:400})} as const;
 const slug=portalTenant(a.session).portalSlug;
 const initial=slug.startsWith('amanda-catherine')?null:await portalFinalDefault(slug,k.data);
 if(!initial)return {error:Response.json({error:'Module unavailable'},{status:404})} as const;
 return {tenant:{organizationId:initial.organizationId,portalSlug:slug},kind:k.data,
 email:String(a.session.email||'').trim().toLowerCase(),role:['staff','admin','owner'].includes(a.session.role)?'staff' as const:'member' as const} as const;
}
export async function GET(req:NextRequest){
 const c=await context(req,req.nextUrl.searchParams.get('kind')||'');
 if('error'in c)return c.error;
 try{
 const key=req.nextUrl.searchParams.get('key');
 if(c.kind==='training' && c.role==='member'){
   const rows=await listFinal(c.tenant,c.kind,c.role);
   const mine=rows.filter(r=>r.source===c.email);
   return Response.json({ok:true,...(key?{record:mine.find(r=>r.key===key)||null}:{records:mine})});
 }
 return Response.json({ok:true,...(key?{record:await readFinal(c.tenant,c.kind,key,c.role)}:
   {records:await listFinal(c.tenant,c.kind,c.role)})});}
 catch{return Response.json({error:'Unavailable'},{status:404});}
}
export async function POST(req:NextRequest){
 const body=z.object({kind:FinalKind,action:z.enum(['create','transition','generate']),
 key:z.string(),title:z.string().optional(),body:z.string().optional(),
 visibility:z.enum(['staff','member']).optional(),state:z.enum(['draft','submitted','delivered','responded','published','enrolled','in_progress','completed','ready']).optional(),
 reply:z.string().optional(),progress:z.number().optional(),channel:z.string().optional(),source:z.string().optional(),sourceText:z.string().optional()}).strict().safeParse(await req.json().catch(()=>null));
 if(!body.success)return Response.json({error:'Invalid workflow'},{status:400});
 const c=await context(req,body.data.kind);
 if('error'in c)return c.error;
 const d=body.data;
 try{
 if(d.action==='generate'){
   if(c.role!=='staff'||(c.kind!=='pulse'&&c.kind!=='amplifi'))
     return Response.json({error:'Generator unavailable'},{status:403});
   const generated=await generateFinal(c.tenant,c.kind,{key:d.key,title:d.title||'Generated content',
     sourceText:d.sourceText||d.body||''},'staff');
   return Response.json({ok:true,record:generated,generation:'source-grounded-deterministic'});
 }
 if(c.kind==='training' && d.action==='create'){
   const courses=await listPublishedTrainingForTenant(c.tenant.portalSlug);
   if(!courses.some(course=>course.id===d.key))
     return Response.json({error:'Course is not published for this tenant'},{status:409});
 }
 if(c.kind==='landing' && d.action==='transition' && d.state==='published'){
   const page=await findPublishedSitePage(c.tenant.portalSlug);
   if(!page)return Response.json({error:'Publish with Experience Builder before marking live'},{status:409});
 }
 const enrollmentKey=c.kind==='training' && c.role==='member'
   ?'course-'+brickHash([c.tenant.organizationId,c.email,d.key]).slice(0,40):d.key;
 if(c.kind==='training' && c.role==='member' && !c.email)
   return Response.json({error:'Authenticated student identity required'},{status:401});
 if(c.kind==='training' && c.role==='member' && d.action==='transition'){
   const mine=await readFinal(c.tenant,c.kind,d.key,'member');
   if(mine.source!==c.email)return Response.json({error:'Not your enrollment'},{status:403});
 }
 const row=d.action==='create'
   ?await saveFinal(c.tenant,c.kind,{key:enrollmentKey,title:d.title,body:d.body,
     visibility:d.visibility||'member',state:d.state||'submitted',channel:d.channel,
     source:c.kind==='training'&&c.role==='member'?c.email:d.source},c.role)
   :await transitionFinal(c.tenant,c.kind,d.key,{state:d.state,reply:d.reply,progress:d.progress},c.role);
 return Response.json({ok:true,record:row});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Failed'},{status:400});}
}