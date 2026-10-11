import { NextRequest } from 'next/server';
import { guardPortalApi,portalApiUnauthorized,portalTenant } from '@/lib/api/portal-route';
import { portalContentDefault } from '@/lib/bricks/content-portal';
import { readContent,ContentKind } from '@/lib/bricks/content-family';

const TYPES=new Set(['application/pdf','text/plain','text/markdown','image/png','image/jpeg','application/json']);
export async function GET(req:NextRequest){
 const auth=await guardPortalApi(req,{realm:'portal'});if(!auth.ok)return portalApiUnauthorized(auth);
 const slug=portalTenant(auth.session).portalSlug,kind=ContentKind.safeParse(req.nextUrl.searchParams.get('kind'));
 const key=req.nextUrl.searchParams.get('key');
 if(!kind.success||!key||!/^[a-z0-9-]{1,80}$/.test(key))return Response.json({error:'Invalid item'},{status:400});
 if(!['documents','resources','reports'].includes(kind.data))return Response.json({error:'Not downloadable'},{status:404});
 const initial=await portalContentDefault(slug,kind.data);
 if(!initial)return Response.json({error:'Content unavailable'},{status:404});
 const role=['staff','admin','owner'].includes(auth.session.role)?'staff':'member';
 try{
  const row=await readContent({organizationId:initial.organizationId,portalSlug:slug},kind.data,key,role);
  if(!row.body||row.state==='queued')return Response.json({error:'Artifact not ready'},{status:404});
  const mime=kind.data==='reports'?'application/json':row.mediaType;
  if(!mime||!TYPES.has(mime))return Response.json({error:'Unsupported content'},{status:404});
  const bytes=kind.data==='reports'?Buffer.from(row.body,'utf8'):Buffer.from(row.body,'base64');
  return new Response(new Uint8Array(bytes),{status:200,headers:{
   'Content-Type':mime,'Content-Disposition':'attachment; filename="'+key+'"',
   'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store',
   'Content-Security-Policy':'sandbox',
  }});
 }catch{return Response.json({error:'Content unavailable'},{status:404});}
}
