/**
 * Dedicated QA-only Cigar CTP submission. Deliberately separate from live
 * Assessments/CTP Submissions/Prospects. Never provisions portal or sends email.
 */
import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {airtableConfigured,airtableCreate} from '@/lib/data/airtable-client';
import {checkRateLimit} from '@/lib/ai/rate-limit';
import {CIGAR_QUESTIONS,visibleCigarQuestions,primaryRole,buildCigarPreview,type CigarAnswers} from '@/lib/cigar-ctp/engine';
import {calculateCapacityImpact,buildAssessmentEmailPreview} from '@/lib/cigar-ctp/impact';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const TABLE='Cigar CTP Staging QA';
const respond=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='preview')return respond({ok:false,error:'Staging QA is available only on a Vercel preview deployment.'},404);
 const origin=req.headers.get('origin');
 if(!origin)return respond({ok:false,error:'Browser origin required.'},403);
 try{if(new URL(origin).host!==req.headers.get('host'))return respond({ok:false,error:'Invalid origin.'},403);}
 catch{return respond({ok:false,error:'Invalid origin.'},403);}
 if(!checkRateLimit('cigar:qa-submit:'+(req.headers.get('x-forwarded-for')??'unknown').slice(0,90),5,60*60*1000).ok) return respond({ok:false,error:'QA submission rate limit reached.'},429);
 if(Number(req.headers.get('content-length')??0)>48000)return respond({ok:false,error:'QA payload is too large.'},413);
 let body:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>48000) return respond({ok:false,error:'QA payload is too large.'},413);
   body=JSON.parse(raw) as Record<string,unknown>;}catch{return respond({ok:false,error:'Invalid JSON.'},400);}
 if(body.qaOnly!==true||body.consent!==true)return respond({ok:false,error:'QA-only confirmation required.'},400);
 const businessName=String(body.businessName??'').trim().slice(0,100);
 const contactName=String(body.contactName??'').trim().slice(0,100);
 const email=String(body.email??'').trim().toLowerCase();
 if(!/^qa\b|^test\b/i.test(businessName)||!/^qa\b|^test\b/i.test(contactName)||!/^[^@\s]+@[a-z0-9.-]+\.example$/.test(email)||email.length>150)
  return respond({ok:false,error:'Only fictional QA names beginning with QA or Test and .example email addresses are allowed.'},400);
 const incoming=body.answers;
 if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))return respond({ok:false,error:'Assessment answers are missing.'},400);
 const answerData=incoming as Record<string,unknown>;
 if(Object.keys(answerData).length>30)return respond({ok:false,error:'Too many question answers.'},400);
 const answers:CigarAnswers={};
 for(const question of CIGAR_QUESTIONS){
  const record=answerData[question.id];if(record===undefined)continue;
  if(!record||typeof record!=='object'||Array.isArray(record))return respond({ok:false,error:'Invalid answer format.'},400);
  const value=record as Record<string,unknown>;
  if(!Array.isArray(value.selected)||typeof value.detail!=='string'||value.detail.length>2000||value.selected.length>15)
   return respond({ok:false,error:'Invalid answer format.'},400);
  if(value.selected.some(x=>typeof x!=='string'||!question.options.some(o=>o.id===x)))return respond({ok:false,error:'Unknown answer option.'},400);
  if(question.type==='single'&&value.selected.length>1)return respond({ok:false,error:'Choose one answer.'},400);
  answers[question.id]={selected:value.selected as string[],detail:value.detail};
 }
 const role=primaryRole(answers);
 if(!['brand','lounge','distributor','other','unsure'].includes(role))return respond({ok:false,error:'Invalid business type.'},400);
 const visible=visibleCigarQuestions(answers);
 if(visible.some(q=>!answers[q.id]?.selected.length))return respond({ok:false,error:'Complete all guided questions before submitting QA.'},400);
 if(Object.keys(answers).some(id=>!visible.some(q=>q.id===id)))return respond({ok:false,error:'Answer path mismatch.'},400);
 const hours=typeof body.hoursPerWeek==='number'?body.hoursPerWeek:null;
 const labor=typeof body.laborCostPerHour==='number'?body.laborCostPerHour:null;
 if((hours!==null&&(!Number.isFinite(hours)||hours<0||hours>168))||(labor!==null&&(!Number.isFinite(labor)||labor<0||labor>1000)))
  return respond({ok:false,error:'Invalid optional numerical values.'},400);
 const impact=calculateCapacityImpact({hoursPerWeek:hours,laborCostPerHour:labor});
 const preview=buildCigarPreview(answers);
 const emailDraft=buildAssessmentEmailPreview({businessName,contactName},answers,preview.findings,impact);
 if(!airtableConfigured())return respond({ok:false,error:'Staging CRM is not configured. No record saved.'},503);
 const id='CIGAR-QA-'+randomUUID();
 const fields={
  'QA Submission ID':id,
  'Business Label':businessName,
  'Role':role,
  'Email':email,
  'Answer JSON':JSON.stringify({pack:'1.3',answers}),
  'Findings JSON':JSON.stringify(preview),
  'Capacity JSON':JSON.stringify(impact),
  'Submitted At':new Date().toISOString(),
  'Environment':'preview-only',
  'Email Status':'draft-not-sent',
 };
 const record=await airtableCreate(TABLE,fields);
 if(!record)return respond({ok:false,error:'Unable to save staging QA record.'},503);
 return respond({ok:true,qaSubmissionId:id,emailStatus:'draft-not-sent',findings:preview.findings,impact,emailDraft:{subject:emailDraft.subject,body:emailDraft.body}});
}
