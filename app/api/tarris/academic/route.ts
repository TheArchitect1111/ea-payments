import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { authorize, db, handled, json, body, sameOrigin, scope } from '@/lib/tb3/server';
export async function POST(req: NextRequest) {return handled(async()=>{sameOrigin(req);const auth=await authorize(req,true);const input=z.object({eligibility:z.enum(['On Track','Review'])}).strict().parse(await body(req));const existing=await db<unknown[]>(`tb3_academic_status?${scope()}`);return json({ok:true,result:await db(existing.length?`tb3_academic_status?${scope()}`:'tb3_academic_status',{method:existing.length?'PATCH':'POST',body:JSON.stringify({...input,workspace_key:auth.workspace,updated_by:auth.actor,updated_at:new Date().toISOString()})})});});}
