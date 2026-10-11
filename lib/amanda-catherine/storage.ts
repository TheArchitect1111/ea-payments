import type { registry } from './registry';
import { registerBrickEvent } from '@/lib/services/brickRegistrar';
import type { TrackingPayment } from '@/lib/services/brickRegistrar';
import {amandaApplicationIdentity} from './queues';
export async function handleAmandaSubmit(p:Record<string,any>, r:Awaited<ReturnType<typeof registry>> | undefined, verifiedPayment?: TrackingPayment){
 // This third argument is supplied only by server-side verified payment handlers.
 // Never accept payment status or references from public submission fields.
 if (verifiedPayment) {
  if (verifiedPayment.event_type !== 'payment_confirmed' ||
      verifiedPayment.payment_status !== 'paid' || !verifiedPayment.registration_id ||
      !verifiedPayment.payment_reference) throw new Error('Verified registration payment required');
  const tracked = await registerBrickEvent({
   brick_type:'payments',brick_id:verifiedPayment.class_id,client_id:'amanda-catherine',
   registration_id:verifiedPayment.registration_id,name:String(p.name||'Verified customer'),
   email:verifiedPayment.email,phone:String(p.phone||''),status:'payment_confirmed',
   payment_status:'paid',payment_reference:verifiedPayment.payment_reference,
   timestamp:verifiedPayment.timestamp,source:'portal/amanda/payment',is_test:verifiedPayment.is_test===true,
  },verifiedPayment);
  if(!tracked.ok)throw new Error(tracked.error||'Payment tracking failed');
  return {ok:true,type:'payment_update',tracking:{success:true},...tracked};
 }
 if (!r) throw new Error('Amanda signup registry is required');
 if(p.type==='application')p={...p,...amandaApplicationIdentity(p.formId,p.context,p.program)};
 const { create } = await import('./registry');
 const now=new Date().toISOString(),id=crypto.randomUUID();
 const course=r.courses.find(c=>c.key===p.courseId);
 const type=p.type==='enroll' && !['READY','LIVE'].includes(course?.status||'')?'waitlist':p.type;
 const results:Record<string,{success:boolean;id?:string;error?:string}>={};
 async function write(key:string,table:string,values:Record<string,unknown>){try{const record=await create(table,values);results[key]={success:true,id:record.id};}catch(e){console.error('[Amanda submission]',key,e);results[key]={success:false,error:'Unable to save '+key};}}
 await write('portal_submissions','Portal Form Submissions',{'Submission ID':id,'Portal Slug':'amanda-catherine',Kind:type,Status:'submitted',Name:p.name,Email:p.email,Phone:p.phone || '',Notes:p.message || '', 'Payload JSON':JSON.stringify({...p,type,organizationId:r.orgId}), 'Created At':now,'Updated At':now});
 if(!results.portal_submissions.success)return {ok:false,type,...results};
 // Every portal application, enrollment and waitlist now enters the same tracking wire.
 // Public users cannot set test mode; the private $1 Stripe flow has a separate guarded entry point.
 const email=String(p.email).trim().toLowerCase();
 const courseId=String(p.courseId || 'application').trim();
 const tracked=await registerBrickEvent({
  brick_type:type==='waitlist'?'waitlist':type==='enroll'?'classes':'applications',
  brick_id:courseId,client_id:'amanda-catherine',registration_id:id,
  name:String(p.name),email,phone:String(p.phone||''),status:type,
  payment_status:'unpaid',payment_reference:null,timestamp:now,
  source:String(p.sourcePage||'/portal/amanda-catherine/enroll'),is_test:false,
 });
 results.tracking=tracked.ok?{success:true}:{success:false,error:tracked.error||'Tracking unavailable'};
 if(type==='application')await write('business_interested','Business Interested',{
  Title:`Application — ${p.formId} — ${id}`,'CTA Name':String(p.formId),'Source Page':String(p.sourcePage||'/portal/amanda-catherine/apply'),
  Timestamp:now,Portal:'amanda-catherine','Portal Slug':'amanda-catherine',Event:'application',Status:'submitted',
  'Payload JSON':JSON.stringify({event:'application',form_id:p.formId,owner_queue:p.ownerQueue,program:p.program,submission_id:id,timestamp:now})});

 if(type==='waitlist'){
  await write('waitlist','amanda_waitlist',{student_name:p.name,student_email:p.email,student_phone:p.phone || '',course_slug:p.courseId,course_name:course?.title || p.courseId,student_message:p.message || '',portal_slug:'amanda-catherine',submitted_at:now});
  const sourcePage=typeof p.sourcePage==='string'&&p.sourcePage.startsWith('/portal/amanda-catherine/')?p.sourcePage:'/portal/amanda-catherine/enroll';
  const payload={event:'waitlist_application',cta_name:'Premium Waitlist Application',page:sourcePage,timestamp:now,portal_slug:'amanda-catherine',course_name:course?.title||p.courseId,course_key:p.courseId,price:course?.price??null,square_url_if_enroll:course?.square_checkout_url??null};
  await write('business_interested','Business Interested',{Title:`Premium Waitlist Application — ${course?.title||p.courseId} — ${now}`,'CTA Name':'Premium Waitlist Application','Source Page':sourcePage,Timestamp:now,Portal:'amanda-catherine','Portal Slug':'amanda-catherine',Event:'waitlist_application','Course Name':course?.title||p.courseId,'Course Key':p.courseId,Price:course?.price??undefined,'Square URL':course?.square_checkout_url||undefined,'Payload JSON':JSON.stringify(payload)});
 }
 if(type==='enroll'){
 await write('creative_studio','Creative Studio',{'Record Key':`amanda-enrollment:${id}`,'Record Type':'Experience','Organization ID':r.orgId,Title:`Enrollment: ${course?.title}`,'Payload JSON':JSON.stringify({...p,organizationId:r.orgId,portalSlug:'amanda-catherine',kind:'enrollment',createdAt:now}),'Updated At':now});
 await write('client_records','Client Records',{'Client Name':p.name,Email:p.email,Phone:p.phone || '',Organization:r.orgId,'Portal Slug':'amanda-catherine','Lifecycle Stage':'Active Enrolled'});
 }
 return {ok:Object.values(results).every(x=>x.success),type,...results};
}
