import type { NextRequest } from 'next/server';
import { get } from '@vercel/blob';
import { z } from 'zod';
import { authorize, db, handled, scopedId, Tb3Error } from '@/lib/tb3/server';
export async function GET(req: NextRequest, context:{params:Promise<{id:string}>}) {return handled(async()=>{
  const auth=await authorize(req);const id=z.string().uuid().parse((await context.params).id);
  const documents=await db<{private_storage_path:string;display_name:string}[]>(`tb3_documents?${scopedId(id)}`);const doc=documents[0];
  if(!doc || !doc.private_storage_path.startsWith(`tb3-contracts/${auth.workspace}/`))throw new Tb3Error(404,'Document not found.');
  const file=await get(doc.private_storage_path,{access:'private',useCache:false});if(!file||file.statusCode!==200)throw new Tb3Error(404,'Document unavailable.');
  const name=doc.display_name.replace(/[^a-zA-Z0-9._-]/g,'_');
  return new Response(file.stream,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${name}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
});}
