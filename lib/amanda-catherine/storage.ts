import {registry,create} from './registry';
export async function handleAmandaSubmit(p:Record<string,any>, r:Awaited<ReturnType<typeof registry>>){
 const now=new Date().toISOString(),id=crypto.randomUUID();
 const course=r.courses.find(c=>c.key===p.courseId);
 const type=p.type==='enroll' && course?.status!=='READY'?'waitlist':p.type;
 const results:Record<string,{success:boolean;id?:string;error?:string}>={};
 async function write(key:string,table:string,values:Record<string,unknown>){try{const record=await create(table,values);results[key]={success:true,id:record.id};}catch(e){console.error('[Amanda submission]',key,e);results[key]={success:false,error:'Unable to save '+key};}}
 await write('portal_submissions','Portal Form Submissions',{'Submission ID':id,'Portal Slug':'amanda-catherine',Kind:type,Status:'New',Name:p.name,Email:p.email,Phone:p.phone || '',Notes:p.message || '', 'Payload JSON':JSON.stringify({...p,type,organizationId:r.orgId}), 'Created At':now,'Updated At':now});
 if(!results.portal_submissions.success)return {ok:false,type,...results};
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