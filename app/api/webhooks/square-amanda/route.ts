import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { confirmTrackingPayment } from '@/lib/services/trackingPortal';
import { getAmandaConfirmationLetter } from '@/lib/amanda-catherine/confirmation-letters';
import { sendAuthEmail } from '@/lib/ea-auth-email';

export const dynamic='force-dynamic';
type SquareOrder={email:string;class_id:string;registration_id:string;order_id:string;
  expected_amount:number;payment_status:string;payment_reference?:string;confirmation_sent?:boolean;
  is_test:false;created_at:string};
function safe(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function verified(raw:string,received:string,key:string,url:string){
  if(!key||!url||!received)return false;
  const expected=createHmac('sha256',key).update(url+raw).digest('base64');
  const a=Buffer.from(expected),b=Buffer.from(received);
  return a.length===b.length && timingSafeEqual(a,b);
}
export async function POST(req:NextRequest){
  const secret=process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim()||'';
  const notificationUrl=process.env.SQUARE_WEBHOOK_NOTIFICATION_URL?.trim()||'';
  const token=process.env.SQUARE_ACCESS_TOKEN?.trim()||'';
  if(!secret||!notificationUrl||!token)
    return NextResponse.json({ok:false,error:'Square webhook is not configured'},{status:503});
  const raw=await req.text();
  if(!verified(raw,req.headers.get('x-square-hmacsha256-signature')||'',secret,notificationUrl))
    return NextResponse.json({ok:false,error:'Invalid Square webhook signature'},{status:403});
  const event=JSON.parse(raw||'{}');
  if(event.type!=='payment.updated' && event.type!=='payment.created')
    return NextResponse.json({ok:true,ignored:true});
  const paymentId=String(event.data?.object?.payment?.id||'');
  if(!/^[a-zA-Z0-9_-]{8,120}$/.test(paymentId))
    return NextResponse.json({ok:false,error:'Missing Square payment ID'},{status:400});
  try{
    // Never trust a browser success redirect or unverified webhook payment fields.
    const res=await fetch('https://connect.squareup.com/v2/payments/'+encodeURIComponent(paymentId),{
      headers:{Authorization:'Bearer '+token,'Square-Version':'2026-09-16'},
      signal:AbortSignal.timeout(10000),cache:'no-store'});
    if(!res.ok)throw new Error('Square payment verification failed: '+res.status);
    const {payment}=await res.json();
    if(payment?.status!=='COMPLETED')return NextResponse.json({ok:true,pending:true});
    const orderId=String(payment.order_id||'');
    if(!orderId)return NextResponse.json({ok:false,error:'Square payment has no correlated order'},{status:409});
    const id='amanda-square-order-'+orderId;
    const order=await loadStudioRecord<SquareOrder>('experience',id);
    if(!order||order.order_id!==orderId||order.is_test!==false)
      return NextResponse.json({ok:false,error:'Unknown Square registration order'},{status:409});
    if(payment.amount_money?.currency!=='CAD'||Number(payment.amount_money?.amount)!==order.expected_amount)
      return NextResponse.json({ok:false,error:'Square payment amount differs from checkout'},{status:409});
    if(order.payment_reference && order.payment_reference!==paymentId)
      return NextResponse.json({ok:false,error:'Conflicting payment on registration'},{status:409});
    await confirmTrackingPayment({
      event_type:'payment_confirmed',registration_id:order.registration_id,email:order.email,
      class_id:order.class_id,payment_status:'paid',payment_reference:paymentId,
      payment_provider:'square',timestamp:String(payment.updated_at||new Date().toISOString()),is_test:false,
    });
    let next:SquareOrder={...order,payment_status:'paid',payment_reference:paymentId};
    if(!order.confirmation_sent){
      const letter=await getAmandaConfirmationLetter('live');
      const firstName=order.email.split('@')[0];
      const body=letter.body_html.replace(/{{first_name}}/g,safe(firstName))
        .replace(/{{class_name}}/g,safe(order.class_id));
      const sent=await sendAuthEmail({to:order.email,subject:letter.subject.replace(/{{class_name}}/g,order.class_id),
        title:'Amanda Catherine registration confirmation',bodyHtml:body,
        text:'Your registration for '+order.class_id+' is confirmed. Payment reference: '+paymentId});
      if(!sent.ok)throw new Error(sent.error||'Amanda letter delivery failed');
      next={...next,confirmation_sent:true};
    }
    const saved=await saveStudioRecord({recordType:'experience',id,
      organizationId:syntheticOrgId('amanda-catherine'),title:'Amanda Square verified payment',
      payload:next});
    if(!saved.ok)throw new Error(saved.error||'Square confirmation state not saved');
    return NextResponse.json({ok:true,updated:true,payment_reference:paymentId});
  }catch(error){
    console.error('[Amanda Square webhook]',error);
    // Return non-2xx so Square can retry a temporary storage or email failure.
    return NextResponse.json({ok:false,error:'Square payment tracking deferred'},{status:503});
  }
}
