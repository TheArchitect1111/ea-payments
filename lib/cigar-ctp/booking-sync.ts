import {createHmac} from 'node:crypto';
import {NextRequest} from 'next/server';
import {airtableConfigured,airtableQuery,airtableUpdate,type AirtableRecord} from '@/lib/data/airtable-client';
import {cigarCallbackUrl,findCigarBooking,readCigarBooking,CigarCalendlyConnectionError,type MatchedBooking} from './calendly-connection';
import {cigarCalendlySigningKey} from './calendly-signature';
import {isCigarTestRecord} from './provider-test';
import {POST as applyVerifiedBooking} from '@/app/api/cigar-ctp/calendly/webhook/route';
const TABLE='Cigar CTP Lead Intake';
function requireEnabled(){
 if(!['preview','production'].includes(process.env.VERCEL_ENV??'')||process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED!=='true'||!airtableConfigured())throw new CigarCalendlyConnectionError('Cigar booking checks are not enabled in this environment.');
}
async function apply(booking:MatchedBooking,canceled=false){
 const payload=JSON.stringify({event:canceled?'invitee.canceled':'invitee.created',payload:{...booking.invitee,event:booking.event.uri,scheduled_event:booking.event}});
 const seconds=String(Math.floor(Date.now()/1000));
 const signature=createHmac('sha256',cigarCalendlySigningKey()).update(seconds+'.'+payload).digest('hex');
 const response=await applyVerifiedBooking(new NextRequest(cigarCallbackUrl(),{method:'POST',headers:{'content-type':'application/json','calendly-webhook-signature':'t='+seconds+',v1='+signature},body:payload}));
 const result=await response.json() as Record<string,unknown>;
 if(!response.ok||result.ignored)throw new CigarCalendlyConnectionError('Verified Cigar booking could not be applied.');
 return result;
}
export async function syncCigarRecords(records:AirtableRecord[]){
 requireEnabled();
 if(records.length>10||process.env.VERCEL_ENV==='preview'&&records.some(x=>!isCigarTestRecord(x.fields)))throw new CigarCalendlyConnectionError('Preview may check up to ten TEST Cigar records only.');
 const proof:Record<string,unknown>[]=[];
 const deadline=Date.now()+240000;let checked=0;
 for(const record of records){
  if(Date.now()>deadline)break;
  checked++;
  if(record.fields['Workflow Status']==='completed'){proof.push({recordId:record.id,unchanged:true,stage:'completed'});continue;}
  let error='';
  try{
   const email=String(record.fields.Email??''),id=String(record.fields['Submission ID']??'');
   const oldUri=String(record.fields['Calendly Invitee URI']??'');
   let canceled:Record<string,unknown>|undefined;
   let booking:MatchedBooking|null=null;
   if(oldUri){
    const stored=await readCigarBooking(oldUri,email,id);
    if(stored.invitee.status==='canceled')canceled=await apply(stored,true);
    else booking=stored;
   }
   if(!booking)booking=await findCigarBooking(email,id);
   if(booking){
    const result=await apply(booking);
    if(result.confirmationSent===false)throw new CigarCalendlyConnectionError('Booking saved, but confirmation delivery or persistence needs retry.');
    proof.push({recordId:record.id,matched:true,eventUri:booking.event.uri,inviteeUri:booking.invitee.uri,start:booking.event.start_time,end:booking.event.end_time,...result});
   }else proof.push({recordId:record.id,matched:false,...(canceled??{})});
  }catch(cause){
   error=cause instanceof CigarCalendlyConnectionError?cause.message:'Cigar booking check failed. No provider proof was inferred.';
   proof.push({recordId:record.id,ok:false,error});
  }
  if(!await airtableUpdate(TABLE,record.id,{'Booking Checked At':new Date().toISOString(),'Booking Sync Error':error}))proof.push({recordId:record.id,ok:false,error:'Unable to save booking check outcome.'});
 }
 return {ok:!proof.some(x=>x.ok===false),checked,proof};
}
export async function pollCigarBookings(){
 requireEnabled();
 const pending="OR({Workflow Status}='submitted',{Workflow Status}='emailed',{Workflow Status}='scheduled')";
 const filter=process.env.VERCEL_ENV==='preview'?"AND("+pending+",REGEX_MATCH({Business Name},'(^|[^A-Za-z0-9_])TEST([^A-Za-z0-9_]|$)'),REGEX_MATCH({Contact Name},'(^|[^A-Za-z0-9_])TEST([^A-Za-z0-9_]|$)'))":pending;
 const records=await airtableQuery(TABLE,{filterByFormula:filter,maxRecords:10,sortField:'Booking Checked At',sortDirection:'asc'});
 return syncCigarRecords(records);
}
