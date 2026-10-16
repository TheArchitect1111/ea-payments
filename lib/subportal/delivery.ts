/** Only real Resend acceptance + durable PDF evidence satisfies welcome(). */
import 'server-only';
import {createSubportalReceipt,subportalPdfChecksum} from './receipt';
import {subportalDb,type DeliveryRow} from './db';
import type {Manifest} from './manifest';

export async function deliverSubportalWelcome(input:{
  sessionId:string;provider:'stripe'|'square';studentId:string;enrollmentId:string;
  studentEmail:string;studentName:string;organizationId:string;
  manifest:Manifest;offerTitle:string;amountCadCents:number;paymentReference:string;
}){
  const previous=await subportalDb<DeliveryRow>('subportal_deliveries',{
    query:{session_id:'eq.'+encodeURIComponent(input.sessionId),select:'*',limit:'1'},
  });
  if(previous[0]?.email_id && previous[0]?.receipt_pdf_base64)return previous[0];
  const key=process.env.RESEND_API_KEY;
  const sender=process.env.RESEND_FROM_EMAIL;
  if(!key || !sender)throw new Error('Real Resend delivery unavailable');
  const pdf=createSubportalReceipt({studentName:input.studentName,brandName:input.manifest.brand.name,
    offerTitle:input.offerTitle,amountCadCents:input.amountCadCents,provider:input.provider,
    paymentReference:input.paymentReference,paidAt:new Date().toISOString()});
  if(!pdf.toString('ascii',0,8).startsWith('%PDF-'))throw new Error('Receipt PDF bytes invalid');
  const path='/portal/'+encodeURIComponent(input.manifest.orgSlug)+'/students/'+input.studentId;
  const origin=(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.efficiencyarchitects.online').replace(/\/$/,'');
  const loginUrl=origin+'/portal/subportal-auth?next='+encodeURIComponent(path);
  const nextSteps='Sign in with your verified email, open your program, and select Continue Learning.';
  const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const html='<h1>Welcome to '+esc(input.manifest.brand.name)+'</h1><p>Hello '+esc(input.studentName)+
    ', your enrollment in '+esc(input.offerTitle)+' is confirmed.</p><p><a href="'+loginUrl+
    '">Open your private learning portal</a></p><p>'+nextSteps+'</p>';
  const res=await fetch('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',
      'Idempotency-Key':('subportal-'+input.provider+'-'+input.sessionId).slice(0,256)},
    body:JSON.stringify({from:sender,to:[input.studentEmail],reply_to:input.manifest.brand.supportEmail,
      subject:'Your '+input.offerTitle+' portal is ready',
      html,text:'Your enrollment is confirmed. Open '+loginUrl+'. '+nextSteps,
      attachments:[{filename:'Payment-Receipt.pdf',content:pdf.toString('base64'),content_type:'application/pdf'}]}),
    signal:AbortSignal.timeout(15000),
  });
  if(!res.ok)throw new Error('Resend rejected welcome: HTTP '+res.status);
  const result=await res.json() as {id?:string};
  if(!result.id || !/^[a-zA-Z0-9_-]{12,128}$/.test(result.id))throw new Error('Email provider did not return a real message ID');
  const rows=await subportalDb<DeliveryRow>('subportal_deliveries',{
    method:'POST',query:{on_conflict:'session_id'},prefer:'resolution=merge-duplicates,return=representation',
    payload:{session_id:input.sessionId,organization_id:input.organizationId,provider:input.provider,
      delivery_status:'accepted',
      student_id:input.studentId,enrollment_id:input.enrollmentId,
      email_id:result.id,receipt_pdf_base64:pdf.toString('base64'),receipt_sha256:subportalPdfChecksum(pdf),
      success_page:path,access_link:path,next_steps:nextSteps},
  });
  if(!rows[0]?.email_id || !rows[0]?.receipt_pdf_base64)throw new Error('Delivery proof not durable');
  return rows[0];
}
export async function verifiedSubportalWelcome(sessionId:string){
  const rows=await subportalDb<DeliveryRow>('subportal_deliveries',{
    query:{session_id:'eq.'+encodeURIComponent(sessionId),select:'*',limit:'1'},
  });
  const d=rows[0];
  if(!d?.email_id || !d.receipt_pdf_base64 || !d.access_link || !d.next_steps || !d.success_page)
    throw new Error('Verified welcome email, PDF, and access proof missing');
  const pdf=Buffer.from(d.receipt_pdf_base64,'base64');
  if(!pdf.toString('ascii',0,8).startsWith('%PDF-'))throw new Error('Stored receipt is not a PDF');
  return {successPage:d.success_page,emailId:d.email_id,receiptPdf:'/api/subportal/receipt?sessionId='+encodeURIComponent(sessionId),
    nextSteps:d.next_steps,accessLink:d.access_link};
}
