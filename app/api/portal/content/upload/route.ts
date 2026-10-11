import { NextRequest } from 'next/server';
import { guardPortalApi,portalApiUnauthorized,portalTenant } from '@/lib/api/portal-route';
import { portalContentDefault } from '@/lib/bricks/content-portal';
import { brickHash } from '@/lib/bricks/durable';
import { saveContent,readContent } from '@/lib/bricks/content-family';

const TYPES=new Set(['application/pdf','text/plain','text/markdown','image/png','image/jpeg']);
const LIMIT=120000;
export async function POST(req:NextRequest){
 const auth=await guardPortalApi(req,{realm:'portal'});if(!auth.ok)return portalApiUnauthorized(auth);
 if(!['staff','admin','owner'].includes(auth.session.role))return Response.json({error:'Staff only'},{status:403});
 const slug=portalTenant(auth.session).portalSlug;
 try{
  const form=await req.formData(),kind=form.get('kind')==='resources'?'resources':'documents';
  const file=form.get('file');
  if(!(file instanceof File)||file.size===0||file.size>LIMIT||!TYPES.has(file.type))
   return Response.json({error:'Unsupported upload type or size (max 120 KB)'},{status:400});
  const tenantDefault=await portalContentDefault(slug,kind);
  if(!tenantDefault)return Response.json({error:'Module not installed'},{status:404});
  const bytes=Buffer.from(await file.arrayBuffer());
  if((file.type==='application/pdf'&&!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))||
     (file.type==='image/png'&&!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||
     (file.type==='image/jpeg'&&!(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)))
   return Response.json({error:'File content does not match declared type'},{status:400});
  const key='upload-'+brickHash([file.name,file.type,bytes.toString('base64')]).slice(0,40);
  const tenant={organizationId:tenantDefault.organizationId,portalSlug:slug};
  const saved=await saveContent(tenant,kind,{key,title:file.name.slice(0,200),
    visibility:form.get('visibility')==='member'?'member':'staff',
    body:bytes.toString('base64'),mediaType:file.type,
    source:'/portal/'+slug+'/'+kind+'/'+key},'staff');
  const readback=await readContent(tenant,kind,key,'staff');
  if(saved.id!==readback.id||saved.body!==readback.body)throw Error('Upload readback failed');
  return Response.json({ok:true,id:saved.id,key,download:'/api/portal/content/download?kind='+kind+'&key='+key});
 }catch(error){console.error('[content-upload] fail-closed',error);
  return Response.json({error:'Upload could not be stored durably'},{status:503});}
}
