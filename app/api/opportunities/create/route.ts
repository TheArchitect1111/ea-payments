import { registerTb3Event } from '@/lib/tb3/brick-events';
import type { NextRequest } from 'next/server';
import { bookingSchema } from '@/lib/tb3/contracts';
import { db, workspace, handled, json, body, sameOrigin, authorize, Tb3Error } from '@/lib/tb3/server';
import { checkRateLimit } from '@/lib/ai/rate-limit';
export async function POST(req: NextRequest) { return handled(async () => {
  sameOrigin(req);
  const limit = checkRateLimit(`tb3-book:${req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown'}`,10,60000);
  if (!limit.ok) throw new Tb3Error(429,'Please wait a minute before submitting another inquiry.');
  const record = bookingSchema.parse(await body(req));
  const manual = req.nextUrl.searchParams.get('manual') === 'true';
  const actor = manual ? (await authorize(req,true)).actor : 'public-booking';
  const result = await db('rpc/tb3_create_opportunity',{method:'POST',body:JSON.stringify({p_workspace:workspace(),p_record:record,p_source:manual?'PortalManual':'PublicBook',p_actor:actor})});
  const tracked=await registerTb3Event({brick_type:'booking',brick_id:record.type,registration_id:record.request_id,
    name:record.contact_name,email:record.contact_email,phone:record.phone,status:'submitted',
    source:manual?'tb3-hq-booking':'tb3-public-booking'});
  if(!tracked.ok)throw new Tb3Error(503,'Booking saved, tracking delivery unavailable.');
  // Notification is a log only, no outbound email or contact details in logs.
  console.info('TB3 inquiry email notification queued as log only');
  return json({ok:true,result},201);
}); }
