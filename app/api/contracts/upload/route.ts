import type { NextRequest } from 'next/server';
import { put, del } from '@vercel/blob';
import { z } from 'zod';
import { authorize, db, handled, json, sameOrigin, scopedId, Tb3Error } from '@/lib/tb3/server';
export async function POST(req: NextRequest) {return handled(async()=>{
  sameOrigin(req);const auth=await authorize(req,true);
  if (Number(req.headers.get('content-length')||0)>10500000) throw new Tb3Error(413,'PDF must be smaller than 10 MB.');
  const form=await req.formData();const file=form.get('file');const kind=z.enum(['Contract','Transcript']).parse(form.get('kind')||'Contract');
  if (!(file instanceof File) || !file.size || file.size>10485760 || file.type!=='application/pdf') throw new Tb3Error(400,'Choose a PDF under 10 MB.');
  const bytes=Buffer.from(await file.arrayBuffer());if(bytes.subarray(0,5).toString()!=='%PDF-') throw new Tb3Error(400,'The file is not a PDF.');
  const opportunity_id=kind==='Contract'?z.string().uuid().parse(form.get('opportunity_id')):null;
  if(opportunity_id){const rows=await db<unknown[]>(`tb3_opportunities?${scopedId(opportunity_id)}`);if(!rows.length)throw new Tb3Error(404,'Opportunity not found.');}
  const path=`tb3-contracts/${auth.workspace}/${kind.toLowerCase()}/${crypto.randomUUID()}.pdf`;
  const blob=await put(path,bytes,{access:'private',contentType:'application/pdf',addRandomSuffix:false});
  let documents;
  try {documents=await db('tb3_documents',{method:'POST',body:JSON.stringify({workspace_key:auth.workspace,kind,opportunity_id,display_name:file.name.slice(0,200),private_storage_path:blob.pathname,size_bytes:file.size,created_by:auth.actor})});}
  catch(error){await del(blob.url).catch(()=>{});throw error;}
  return json({ok:true,documents},201);
});}
