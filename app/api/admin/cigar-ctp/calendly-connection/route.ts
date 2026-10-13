import {NextRequest,NextResponse} from 'next/server';
import {adminApiUnauthorized,guardAdminApi} from '@/lib/api/admin-route';
import {airtableConfigured,airtableQuery} from '@/lib/data/airtable-client';
import {cigarCallbackUrl,connectCigarCalendly,CigarCalendlyConnectionError} from '@/lib/cigar-ctp/calendly-connection';
import {cigarCalendlySigningKey} from '@/lib/cigar-ctp/calendly-signature';
import {isCigarTestRecord} from '@/lib/cigar-ctp/provider-test';
import {syncCigarRecords,pollCigarBookings} from '@/lib/cigar-ctp/booking-sync';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
const respond=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){
 const auth=await guardAdminApi(req);if(!auth.ok)return adminApiUnauthorized(auth);
 try{return respond({ok:true,tokenConfigured:Boolean(process.env.CIGAR_CALENDLY_API_TOKEN?.trim()),signingConfigured:Boolean(cigarCalendlySigningKey()),callbackUrl:cigarCallbackUrl(),liveEnabled:process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED==='true'});}
 catch{return respond({ok:false,error:'Calendly setup requires an EA Preview or Production deployment.'},503);}
}
export async function POST(req:NextRequest){
 const auth=await guardAdminApi(req);if(!auth.ok)return adminApiUnauthorized(auth);
 const origin=req.headers.get('origin');
 try{if(!origin||new URL(origin).host!==req.headers.get('host'))return respond({ok:false,error:'Invalid origin.'},403);}catch{return respond({ok:false,error:'Invalid origin.'},403);}
 try{
  if(Number(req.headers.get('content-length')??0)>2000)return respond({ok:false,error:'Request too large.'},413);
  const raw=await req.text();if(raw.length>2000)return respond({ok:false,error:'Request too large.'},413);
  const body=JSON.parse(raw) as {action?:string;recordIds?:unknown};
  if(body.action==='connect')return respond({ok:true,...await connectCigarCalendly()});
  if(body.action==='poll')return respond(await pollCigarBookings());
  if(body.action!=='sync'||!Array.isArray(body.recordIds)||body.recordIds.length<1||body.recordIds.length>10||body.recordIds.some(x=>typeof x!=='string'||!/^rec[A-Za-z0-9]{14}$/.test(x)))return respond({ok:false,error:'Select one to ten Cigar intake records to verify.'},400);
  if(process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED!=='true'||!['preview','production'].includes(process.env.VERCEL_ENV??''))return respond({ok:false,error:'The Cigar workflow flag must be enabled in this environment.'},503);
  if(!airtableConfigured())return respond({ok:false,error:'Cigar CRM unavailable.'},503);
  const recordIds=[...new Set(body.recordIds as string[])];
  const records=await airtableQuery('Cigar CTP Lead Intake',{filterByFormula:'OR('+recordIds.map(id=>"RECORD_ID()='"+id+"'").join(',')+')',maxRecords:10});
  if(records.length!==recordIds.length)return respond({ok:false,error:'A selected Cigar intake record was not found.'},404);
  if(process.env.VERCEL_ENV==='preview'&&records.some(x=>!isCigarTestRecord(x.fields)))return respond({ok:false,error:'Preview may sync TEST Cigar records only.'},403);
  const result=await syncCigarRecords(records);
  return respond(result,result.ok?200:503);
 }catch(error){
  return respond({ok:false,error:error instanceof CigarCalendlyConnectionError?error.message:'Calendly connection failed. No provider proof was inferred.'},503);
 }
}
