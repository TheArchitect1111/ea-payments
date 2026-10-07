import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { statusSchema } from '@/lib/tb3/contracts';
import { authorize, db, handled, json, body, sameOrigin } from '@/lib/tb3/server';
export async function PATCH(req: NextRequest, context: {params:Promise<{id:string}>}) {return handled(async()=>{
  sameOrigin(req);const actor=await authorize(req,true);const id=z.string().uuid().parse((await context.params).id);const change=statusSchema.parse(await body(req));
  return json({ok:true,result:await db('rpc/tb3_change_status',{method:'POST',body:JSON.stringify({p_workspace:actor.workspace,p_id:id,p_status:change.status,p_earnings:change.earnings_amount??null})})});
});}
