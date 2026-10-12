import {NextRequest,NextResponse} from 'next/server';
import {airtableConfigured,airtableQuery,airtableUpdate} from '@/lib/data/airtable-client';
import {sendEmail} from '@ea/portal-chassis/email';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const TABLE='Cigar CTP Lead Intake';
/** Cigar-only hourly reminder processor. Existing generic EA CTP reminders are untouched. */
export async function GET(req:NextRequest){
 const secret=process.env.CRON_SECRET?.trim();
 if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({ok:false},{status:401});
 if(process.env.VERCEL_ENV!=='production'||process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED!=='true')
  return NextResponse.json({ok:true,enabled:false,checked:0,sent:0});
 if(!airtableConfigured()||!process.env.RESEND_API_KEY||!process.env.RESEND_FROM_EMAIL)
  return NextResponse.json({ok:false,error:'Reminder integrations unavailable.'},{status:503});
 const now=Date.now();
 const leads=await airtableQuery(TABLE,{filterByFormula:"AND({Workflow Status}='scheduled',{Booking Status}='active',NOT({Reminder Sent At}))",maxRecords:100,sortField:'Meeting Scheduled At',sortDirection:'asc'});
 let checked=0,sent=0,failed=0;
 for(const record of leads){
  const time=new Date(String(record.fields['Meeting Scheduled At']??'')).getTime();
  const until=time-now;
  if(!Number.isFinite(time)||until<20*3600000||until>28*3600000)continue;
  checked++;
  try{
   const email=String(record.fields.Email??'');
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){failed++;continue;}
   const date=new Date(time).toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'full',timeStyle:'short'});
   const first=String(record.fields['Contact Name']??'there').split(/\s+/)[0].replace(/[<>&"']/g,'');
   await sendEmail({to:email,from:process.env.RESEND_FROM_EMAIL,subject:'Your EA Cigar Strategy Meeting is coming up',
    html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#17211c"><img src="https://app.efficiencyarchitects.online/ea-logo.png" alt="Efficiency Architects" width="110"/><p>Hello ${first},</p><p>This is a friendly reminder of your Cigar Business Strategy Meeting on <strong>${date} Eastern</strong>.</p><p>We'll discuss your assessment findings and possible next steps. No preparation is required.</p><p>Efficiency Architects</p></div>`});
   if(await airtableUpdate(TABLE,record.id,{'Reminder Sent At':new Date().toISOString()}))sent++;
   else failed++;
  }catch(error){failed++;console.error('[cigar-ctp] reminder failed',record.id,error instanceof Error?error.message:'unknown');}
 }
 return NextResponse.json({ok:failed===0,checked,sent,failed});
}
