import {NextRequest,NextResponse} from 'next/server';
import {airtableConfigured,airtableQuery,airtableUpdate,escapeAirtableString} from '@/lib/data/airtable-client';
import {verifyCigarCalendlySignature,cigarCalendlySigningKey} from '@/lib/cigar-ctp/calendly-signature';
import {cigarSubmissionIdFromTracking} from '@/lib/cigar-ctp/booking-link';
import {sendEmail} from '@ea/portal-chassis/email';
import {isCigarTestRecord} from '@/lib/cigar-ctp/provider-test';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const TABLE='Cigar CTP Lead Intake';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
type CalendlyEvent={
 event?:string;
 payload?:{
  uri?:string; email?:string; event?:string;
  tracking?:unknown; rescheduled?:boolean;
  scheduled_event?:{uri?:string;event_type?:string;start_time?:string;end_time?:string};
 };
};
const safeTime=(v:unknown):string|null=>{
 if(typeof v!=='string')return null;
 const n=new Date(v);
 return Number.isFinite(n.getTime())?n.toISOString():null;
};

/** Must be registered with Calendly v2 as a SIGNED invitee.created/invitee.canceled subscription.
 * The Cigar CTP source ID and invitee email must BOTH match a persisted cigar lead.
 */
export async function POST(req:NextRequest){
 const providerTest=process.env.VERCEL_ENV==='preview';
 if((process.env.VERCEL_ENV!=='production'&&!providerTest)||process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED!=='true')
  return json({ok:false,error:'Cigar workflow is not activated.'},503);
 const secret=cigarCalendlySigningKey();
 if(!secret)return json({ok:false,error:'Booking signature verification unavailable.'},503);
 const raw=await req.text();
 if(!verifyCigarCalendlySignature(raw,req.headers.get('calendly-webhook-signature'),secret))
  return json({ok:false,error:'Invalid webhook signature.'},401);
 let body:CalendlyEvent;
 try{body=JSON.parse(raw) as CalendlyEvent;}catch{return json({ok:false,error:'Invalid webhook payload.'},400);}
 if(body.event!=='invitee.created'&&body.event!=='invitee.canceled')return json({ok:true,ignored:'event'});
 const payload=body.payload;
 const id=cigarSubmissionIdFromTracking(payload?.tracking);
 const email=payload?.email?.trim().toLowerCase();
 if(!id||!email||!payload?.uri||!/^https:\/\/api\.calendly\.com\/scheduled_events\/[^/]+\/invitees\/[^/]+$/.test(payload.uri))
  return json({ok:true,ignored:'not a tracked Cigar CTP meeting'});
 if(!airtableConfigured())return json({ok:false,error:'Cigar intake data unavailable.'},503);
 const records=await airtableQuery(TABLE,{filterByFormula:`{Submission ID}='${escapeAirtableString(id)}'`,maxRecords:1});
 const record=records[0];
 if(!record||String(record.fields.Email??'').toLowerCase()!==email)return json({ok:true,ignored:'not a matched cigar lead'});
 if(providerTest&&!isCigarTestRecord(record.fields))return json({ok:true,ignored:'Preview accepts TEST records only'});
 const oldUri=String(record.fields['Calendly Invitee URI']??'');
 if(body.event==='invitee.canceled'){
  if(oldUri!==payload.uri)return json({ok:true,ignored:'stale cancellation or reschedule'});
  const status=record.fields['Email Status']==='sent'?'emailed':'submitted';
  const saved=await airtableUpdate(TABLE,record.id,{
   'Workflow Status':status,'Booking Status':payload.rescheduled?'rescheduled':'canceled',
   'Meeting Scheduled At':null,'Meeting Ends At':null,'Calendly Invitee URI':'','Calendly Event URI':'',
   'Meeting Confirmed At':null,'Reminder Sent At':null,
  });
  return saved?json({ok:true,changed:true,stage:status}):json({ok:false,error:'Unable to update booking.'},503);
 }
 const scheduled=payload.scheduled_event;
 const start=safeTime(scheduled?.start_time),end=safeTime(scheduled?.end_time);
 const eventUri=scheduled?.uri??payload.event;
 if(!start||!end||!eventUri?.startsWith('https://api.calendly.com/scheduled_events/'))
  return json({ok:false,error:'Missing or invalid scheduled event timing.'},400);
 const allowedType=process.env.CIGAR_CALENDLY_EVENT_TYPE_URI?.trim();
 if(allowedType&&scheduled?.event_type!==allowedType)return json({ok:true,ignored:'other Calendly meeting type'});
 if(oldUri===payload.uri&&record.fields['Booking Status']==='active'&&record.fields['Meeting Confirmed At'])
  return json({ok:true,unchanged:true,stage:'scheduled'});
 const sameBooking=oldUri===payload.uri;
 const saved=await airtableUpdate(TABLE,record.id,{
  'Workflow Status':'scheduled','Booking Status':'active',
  'Calendly Invitee URI':payload.uri,'Calendly Event URI':eventUri,
  'Meeting Scheduled At':start,'Meeting Ends At':end,
  'Meeting Confirmed At':sameBooking?record.fields['Meeting Confirmed At']??null:null,
  'Reminder Sent At':sameBooking?record.fields['Reminder Sent At']??null:null
 });
 if(!saved)return json({ok:false,error:'Unable to save Cigar booking.'},503);
 let confirmationSent=Boolean(sameBooking&&record.fields['Meeting Confirmed At']);
 if(!confirmationSent&&process.env.RESEND_API_KEY&&process.env.RESEND_FROM_EMAIL){
  try{
   const time=new Date(start).toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'full',timeStyle:'short'});
   const first=String(record.fields['Contact Name']??'there').trim().split(/\s+/)[0];
   const safe=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
   await sendEmail({to:email,from:process.env.RESEND_FROM_EMAIL,subject:'Your EA Cigar Strategy Meeting is confirmed',
    html:`<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;color:#17211c;padding:28px"><img src="https://app.efficiencyarchitects.online/ea-logo.png" alt="Efficiency Architects" width="110"/><h1>We're looking forward to meeting.</h1><p>Hello ${safe(first)},</p><p>Your Cigar Business Strategy Meeting is confirmed for <strong>${safe(time)} Eastern</strong>.</p><p>We'll review your assessment findings, answer questions and discuss opportunities. This meeting does not require a purchase.</p><p>Efficiency Architects</p></div>`});
   await airtableUpdate(TABLE,record.id,{'Meeting Confirmed At':new Date().toISOString()});
   confirmationSent=true;
  }catch(error){console.error('[cigar-booking] confirmation delivery failed',error instanceof Error?error.message:'unknown');}
 }
 return json({ok:true,stage:'scheduled',confirmationSent});
}
