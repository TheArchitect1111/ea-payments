import type { NextRequest } from 'next/server';
import { calendarSchema } from '@/lib/tb3/contracts';
import { authorize, db, handled, json, body, scope, sameOrigin } from '@/lib/tb3/server';
export async function GET(req: NextRequest) {return handled(async()=>{await authorize(req);return json({ok:true,events:await db(`tb3_calendar_events?${scope()}&order=start_time.asc`)});});}
export async function POST(req: NextRequest) {return handled(async()=>{sameOrigin(req);const auth=await authorize(req,true);const event=calendarSchema.parse(await body(req));return json({ok:true,events:await db('tb3_calendar_events',{method:'POST',body:JSON.stringify({...event,workspace_key:auth.workspace,created_by:auth.actor})})},201);});}
