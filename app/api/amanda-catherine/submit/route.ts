import {NextRequest,NextResponse} from 'next/server';
import {handleAmandaSubmit} from '@/lib/amanda-catherine/storage';
import {registry,formDefinition} from '@/lib/amanda-catherine/registry';
import {isAllowedAmandaOrigin} from '@/lib/amanda-catherine/request-origin';
import {sendAmandaWarmLetter, type AmandaWarmLetterCtaType} from '@/lib/email/amanda-warm-letter';
export async function POST(req:NextRequest){
 try{if(!isAllowedAmandaOrigin(req))return NextResponse.json({ok:false,error:'Invalid request origin'},{status:403});
 const json=req.headers.get('content-type')?.includes('application/json');const p=json?await req.json():Object.fromEntries(await req.formData());
 if(!['application','enroll','waitlist'].includes(p.type) || typeof p.name!=='string' || !p.name.trim() || typeof p.email!=='string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))return NextResponse.json({ok:false,error:'Enter a valid name and email.'},{status:400});
 const r=await registry();const course=r.courses.find(c=>c.key===p.courseId);
 if(p.type==='enroll' && !course)return NextResponse.json({ok:false,error:'Choose a listed course.'},{status:400});
 const type=p.type==='enroll' && course?.status!=='READY'?'waitlist':p.type;
 const def=formDefinition(r.forms,type==='application'?'amanda-apply':`amanda-${type}`);
 for(const f of def.fields){if(f.required && !String(p[f.name] || '').trim())return NextResponse.json({ok:false,error:`${f.label} is required.`},{status:400});}
 if(JSON.stringify(p).length>20000)return NextResponse.json({ok:false,error:'Submission is too long.'},{status:413});
 const result=await handleAmandaSubmit({...p,type},r);
 if(!result.ok)return NextResponse.json({...result,error:'Your request could not be saved completely. Please contact Amanda before submitting again.'},{status:502});
 if(!result.warmLetterAttempted){
  const ctaType:AmandaWarmLetterCtaType=type==='application'?'apply':type==='enroll'?'enroll':'waitlist';
  const courseName=course?.title || String(p.courseId || (ctaType==='apply'?'your application':'your next step'));
  try{
   const sent=await sendAmandaWarmLetter({to:String(p.email),name:String(p.name),course:courseName,ctaType});
   console.log('[AMANDA_WORKFLOW] email_queued',{email:p.email,course:courseName,id:sent.id});
  }catch(e){
   console.error('[AMANDA_WORKFLOW] email_failed',{email:p.email,course:courseName,ctaType,error:e instanceof Error?e.message:String(e)});
  }
 }
 if(json)return NextResponse.json(result);
 return NextResponse.redirect(new URL('/portal/amanda-catherine/thank-you',req.url),303);
 }catch(e){console.error('[Amanda submit]',e);return NextResponse.json({ok:false,error:'Submission is temporarily unavailable. Please try again shortly.'},{status:503});}
}
export function GET(){return NextResponse.json({ok:true,endpoint:'POST /api/amanda-catherine/submit'});}
