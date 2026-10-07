import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { authorize, db, handled, json, body, sameOrigin } from '@/lib/tb3/server';
export async function POST(req: NextRequest) {return handled(async()=>{sameOrigin(req);const auth=await authorize(req,true);const input=z.object({name:z.string().trim().min(1).max(200),subject:z.string().max(200).default(''),email:z.union([z.string().email(),z.literal('')]).default(''),phone:z.string().max(60).default('')}).strict().parse(await body(req));return json({ok:true,result:await db('tb3_tutor_contacts',{method:'POST',body:JSON.stringify({...input,workspace_key:auth.workspace,created_by:auth.actor})})},201);});}
