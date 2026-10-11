import { registerTb3Event } from '@/lib/tb3/brick-events';
import type { NextRequest } from 'next/server';
import { activitySchema } from '@/lib/tb3/contracts';
import { authorize, db, handled, json, body, sameOrigin } from '@/lib/tb3/server';
export async function POST(req: NextRequest) {return handled(async()=>{sameOrigin(req);const auth=await authorize(req,true);const record=activitySchema.parse(await body(req));const result=await db('rpc/tb3_log_activity',{method:'POST',body:JSON.stringify({p_workspace:auth.workspace,p_record:record,p_actor:auth.actor})});
const tracked=await registerTb3Event({brick_type:'activity',brick_id:record.type,
 registration_id:record.request_id,name:record.title,email:auth.actor,phone:'',status:'logged',
 source:'tb3-activity',timestamp:record.start_time});
if(!tracked.ok)throw new Error('Activity saved, tracking delivery unavailable.');
return json({ok:true,result},201);});}
