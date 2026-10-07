import {registry,create} from './registry';
import {sendAmandaWarmLetter, type AmandaWarmLetterCtaType} from '@/lib/email/amanda-warm-letter';
export async function handleAmandaSubmit(p:Record<string,any>, r:Awaited<ReturnType<typeof registry>>){
 const now=new Date().toISOString(),id=crypto.randomUUID();
 const course=r.courses.find(c=>c.key===p.courseId);
 const type=p.type==='enroll' && course?.status!=='READY'?'waitlist':p.type;
 const ctaType:AmandaWarmLetterCtaType=type==='application'?'apply':type==='enroll'?'enroll':'waitlist';
 const courseName=course?.title || String(p.courseId || (ctaType==='apply'?'your application':'your next step'));
 const source='amandacatherine.ca';
 const results:Record<string,{success:boolean;id?:string;error?:string}>={};
 async function write(key:string,table:string,values:Record<string,unknown>){try{const record=await create(table,values);results[key]={success:true,id:record.id};}catch(e){console.error('[Amanda submission]',key,e);results[key]={success:false,error:'Unable to save '+key};}}
 await write('portal_submissions','Portal Form Submissions',{'Submission ID':id,'Portal Slug':'amanda-catherine',Kind:type,Status:'New',Name:p.name,Email:p.email,Phone:p.phone || '',Notes:p.message || '', 'Payload JSON':JSON.stringify({...p,type,organizationId:r.orgId,source}), 'Created At':now,'Updated At':now});
 if(!results.portal_submissions.success)return {ok:false,type,warmLetterAttempted:false,warmLetterQueued:false,...results};
 if(type==='waitlist'){
  await write('waitlist','amanda_waitlist',{student_name:p.name,student_email:p.email,student_phone:p.phone || '',course_slug:p.courseId,course_name:courseName,student_message:p.message || '',course_url:`https://amandacatherine.ca/amanda-catherine/courses/${encodeURIComponent(String(p.courseId || ''))}#waitlist`,portal_slug:'amanda-catherine',submitted_at:now});
  const sourcePage=typeof p.sourcePage==='string'&&p.sourcePage.startsWith('/portal/amanda-catherine/')?p.sourcePage:'/portal/amanda-catherine/enroll';
  const payload={event:'waitlist_application',cta_name:'Premium Waitlist Application',page:sourcePage,timestamp:now,portal_slug:'amanda-catherine',source,course_name:courseName,course_key:p.courseId,price:course?.price??null,square_url_if_enroll:course?.square_checkout_url??null};
  await write('business_interested','Business Interested',{Title:`Premium Waitlist Application — ${courseName} — ${now}`,'CTA Name':'Premium Waitlist Application','Source Page':sourcePage,Timestamp:now,Portal:'amanda-catherine','Portal Slug':'amanda-catherine',Event:'waitlist_application','Course Name':courseName,'Course Key':p.courseId,Price:course?.price??undefined,'Square URL':course?.square_checkout_url||undefined,'Payload JSON':JSON.stringify(payload)});
 }
 if(type==='enroll'){
 await write('creative_studio','Creative Studio',{'Record Key':`amanda-enrollment:${id}`,'Record Type':'Experience','Organization ID':r.orgId,Title:`Enrollment: ${course?.title}`,'Payload JSON':JSON.stringify({...p,organizationId:r.orgId,portalSlug:'amanda-catherine',kind:'enrollment',source,createdAt:now}),'Updated At':now});
 await write('client_records','Client Records',{'Client Name':p.name,Email:p.email,Phone:p.phone || '',Organization:r.orgId,'Portal Slug':'amanda-catherine','Lifecycle Stage':'Active Enrolled'});
 }
 const ok=Object.values(results).every(x=>x.success);
 let warmLetterAttempted=false,warmLetterQueued=false;
 if(ok){
  console.log('[AMANDA_WORKFLOW] db_saved',{email:p.email,course:courseName,ctaType,route:'/api/amanda-catherine/submit'});
  warmLetterAttempted=true;
  try{
   const sent=await sendAmandaWarmLetter({to:String(p.email),name:String(p.name),course:courseName,ctaType});
   warmLetterQueued=true;
   console.log('[AMANDA_WORKFLOW] email_queued',{email:p.email,course:courseName,id:sent.id});
  }catch(e){
   console.error('[AMANDA_WORKFLOW] email_failed',{email:p.email,course:courseName,ctaType,error:e instanceof Error?e.message:String(e)});
  }
 }
 return {ok,type,warmLetterAttempted,warmLetterQueued,...results};
}
