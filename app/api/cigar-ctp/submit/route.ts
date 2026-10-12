import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {airtableConfigured,airtableCreate,airtableUpdate} from '@/lib/data/airtable-client';
import {checkRateLimit} from '@/lib/ai/rate-limit';
import {CIGAR_QUESTIONS,visibleCigarQuestions,primaryRole,buildCigarPreview,type CigarAnswers} from '@/lib/cigar-ctp/engine';
import {calculateCapacityImpact} from '@/lib/cigar-ctp/impact';
import {buildCigarReportEmail} from '@/lib/cigar-ctp/report-email';
import {sendEmail} from '@ea/portal-chassis/email';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const TABLE='Cigar CTP Lead Intake';
const respond=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest){
 if(process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED!=='true')return respond({ok:false,error:'Customer submissions are not activated. Preview testing remains available.'},503);
 const origin=req.headers.get('origin');
 if(!origin)return respond({ok:false,error:'Origin required.'},403);
 try{if(new URL(origin).host!==req.headers.get('host'))return respond({ok:false,error:'Invalid origin.'},403);}
 catch{return respond({ok:false,error:'Invalid origin.'},403);}
 if(!checkRateLimit('cigar:lead:'+(req.headers.get('x-forwarded-for')??'unknown').slice(0,90),4,3600000).ok)
 return respond({ok:false,error:'Please try again later.'},429);
 if(Number(req.headers.get('content-length')??0)>48000)return respond({ok:false,error:'Payload too large.'},413);
 let data:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>48000)throw Error('large');data=JSON.parse(raw) as Record<string,unknown>;}
 catch{return respond({ok:false,error:'Invalid request.'},400);}
 const businessName=String(data.businessName??'').trim().slice(0,110);
 const contactName=String(data.contactName??'').trim().slice(0,110);
 const email=String(data.email??'').trim().toLowerCase();
 if(data.consent!==true||!businessName||!contactName||email.length>180||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return respond({ok:false,error:'Please supply business name, contact, valid email and consent.'},400);
 const rawAnswers=data.answers;
 if(!rawAnswers||typeof rawAnswers!=='object'||Array.isArray(rawAnswers)||Object.keys(rawAnswers).length>30)return respond({ok:false,error:'Invalid answers.'},400);
 const answers:CigarAnswers={};
 for(const q of CIGAR_QUESTIONS){
  const val=(rawAnswers as Record<string,unknown>)[q.id];if(val===undefined)continue;
  if(!val||typeof val!=='object'||Array.isArray(val))return respond({ok:false,error:'Invalid answer.'},400);
  const v=val as Record<string,unknown>;
  if(!Array.isArray(v.selected)||v.selected.length>15||typeof v.detail!=='string'||v.detail.length>2000||v.selected.some(x=>typeof x!=='string'||!q.options.some(opt=>opt.id===x))||(q.type==='single'&&v.selected.length>1))return respond({ok:false,error:'Invalid answer choice.'},400);
  answers[q.id]={selected:v.selected as string[],detail:v.detail};
 }
 const visible=visibleCigarQuestions(answers);
 if(visible.some(q=>!answers[q.id]?.selected.length)||Object.keys(answers).some(id=>!visible.some(q=>q.id===id)))return respond({ok:false,error:'Please finish the guided assessment.'},400);
 const hours=data.hoursPerWeek==null?null:Number(data.hoursPerWeek);
 const labor=data.laborCostPerHour==null?null:Number(data.laborCostPerHour);
 if((hours!==null&&(!Number.isFinite(hours)||hours<0||hours>168))||(labor!==null&&(!Number.isFinite(labor)||labor<0||labor>1000)))return respond({ok:false,error:'Invalid optional figures.'},400);
 if(!airtableConfigured())return respond({ok:false,error:'Intake storage unavailable. Please retry.'},503);
 const preview=buildCigarPreview(answers);
 const impact=calculateCapacityImpact({hoursPerWeek:hours,laborCostPerHour:labor});
 const id='CIGAR-'+randomUUID();
 const now=new Date().toISOString();
 const record=await airtableCreate(TABLE,{
 'Submission ID':id,'Business Name':businessName,'Contact Name':contactName,'Email':email,
 'Business Type':primaryRole(answers),'Answers JSON':JSON.stringify(answers),
 'Findings JSON':JSON.stringify(preview),'Capacity JSON':JSON.stringify(impact),
 'Email Status':'pending','Submitted At':now,'Consent At':now
 });
 if(!record)return respond({ok:false,error:'We could not save your assessment. Please retry.'},503);
 if(!process.env.RESEND_API_KEY||!process.env.RESEND_FROM_EMAIL){
  await airtableUpdate(TABLE,record.id,{'Email Status':'needs-configuration','Email Error':'Mail provider not configured'});
  return respond({ok:true,submissionId:id,emailStatus:'pending',message:'We received your assessment. Your email is being prepared.'});
 }
 const report=buildCigarReportEmail({businessName,contactName,answers,hoursPerWeek:hours,laborCostPerHour:labor});
 try{
  await sendEmail({to:email,subject:report.subject,html:report.html,from:process.env.RESEND_FROM_EMAIL});
  await airtableUpdate(TABLE,record.id,{'Email Status':'sent','Email Sent At':new Date().toISOString(),'Email Error':''});
  return respond({ok:true,submissionId:id,emailStatus:'sent'});
 }catch(e){
  const reason=e instanceof Error?e.message:'Email provider error';
  await airtableUpdate(TABLE,record.id,{'Email Status':'failed','Email Error':reason.slice(0,240)});
  return respond({ok:true,submissionId:id,emailStatus:'pending',message:'We received your assessment. Your email is being prepared.'});
 }
}
