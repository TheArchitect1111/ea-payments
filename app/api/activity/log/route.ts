import type { NextRequest } from 'next/server';
import { activitySchema } from '@/lib/tb3/contracts';
import { authorize, db, handled, json, body, sameOrigin } from '@/lib/tb3/server';
export async function POST(req: NextRequest) {return handled(async()=>{sameOrigin(req);const auth=await authorize(req,true);const record=activitySchema.parse(await body(req));return json({ok:true,result:await db('rpc/tb3_log_activity',{method:'POST',body:JSON.stringify({p_workspace:auth.workspace,p_record:record,p_actor:auth.actor})})},201);});}
