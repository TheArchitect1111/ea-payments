import { registerTb3Event } from '@/lib/tb3/brick-events';
import type { NextRequest } from 'next/server';
import { calendarSchema } from '@/lib/tb3/contracts';
import { authorize, db, handled, json, body, scope, scopedId, sameOrigin, Tb3Error } from '@/lib/tb3/server';
export async function GET(req: NextRequest) {return handled(async()=>{await authorize(req);return json({ok:true,events:await db(`tb3_calendar_events?${scope()}&order=start_time.asc`)});});}
export async function POST(req: NextRequest) {return handled(async()=>{sameOrigin(req);const auth=await authorize(req,true);const event=calendarSchema.parse(await body(req));let state='confirmed';if(event.linked_opportunity_id){const opportunities=await db<{status:string;earnings_amount:number|null}[]>(`tb3_opportunities?${scopedId(event.linked_opportunity_id)}`);if(!opportunities.length)throw new Tb3Error(404,'Opportunity not found.');const opportunity=opportunities[0];state=['Contracted','Completed'].includes(opportunity.status)?'confirmed':'tentative';event.earnings_amount=opportunity.earnings_amount;event.completed=opportunity.status==='Completed';}const saved=await db<{id:string}[]>('tb3_calendar_events',{method:'POST',body:JSON.stringify({...event,state,workspace_key:auth.workspace,created_by:auth.actor})});
const eventId=saved[0]?.id;
if(!eventId)throw new Tb3Error(503,'Calendar saved without a durable event ID');
const tracked=await registerTb3Event({brick_type:'calendar',brick_id:event.type,
  registration_id:eventId,name:event.title,email:auth.actor,phone:'',status:state,
  source:'tb3-calendar',timestamp:event.start_time});
if(!tracked.ok)throw new Tb3Error(503,'Calendar saved, tracking delivery unavailable.');
return json({ok:true,events:saved},201);});}
