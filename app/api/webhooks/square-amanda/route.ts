import { amandaPrices } from '@/src/clients/amanda/offers';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { registerBrickEvent } from '@/lib/services/brickRegistrar';
import { getAmandaConfirmationLetter } from '@/lib/amanda-catherine/confirmation-letters';
import { provisionAmandaClientAccess } from '@/lib/amanda-catherine/client-access';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { sendAmandaPremiumReceiptEmail } from '@/lib/amanda-catherine/premium-receipt-email';
import { airtableCreate, airtableQuery, airtableUpdate, escapeAirtableString } from '@/lib/data/airtable-client';

export const dynamic='force-dynamic';
type SquareOrder={email:string;name?:string;phone?:string;class_name?:string;class_id:string;registration_id:string;order_id:string;
  expected_amount:number;payment_status:string;payment_reference?:string;confirmation_sent?:boolean;owner_notification_sent?:boolean;
  is_test:false;created_at:string;receipt_url?:string;paid_amount_cad?:number;paid_at?:string};
const DIRECT_SQUARE_PRODUCTS: Array<{name:string;class_id:string;course_id?:string;expected_amount:number}> = [
  {name:'Body Sculpt Certification',class_id:'body-sculpt-certification',course_id:'body-sculpt-practitioner-certification',expected_amount:249700},
  {name:'Nervous System Reset Certification',class_id:'nervous-system-reset',course_id:'aesthetikine-reset-training',expected_amount:99700},
  {name:'Wood Therapy Training & 7 Piece Set',class_id:'wood-therapy',course_id:'wood-therapy-certification',expected_amount:99700},
  {name:'Glute Sculpt & Build Certification',class_id:'non-surgical-bbl',course_id:'non-surgical-bbl-training',expected_amount:149700},
  {name:'Clinical Fat Loss Injectables: Face & Body Contouring Certification',class_id:'clinical-fat-loss',course_id:'clinical-fat-loss-injectables',expected_amount:149700},
  {name:'Strategy Mentorship Call',class_id:'strategy-call',expected_amount:Math.round(amandaPrices.price('strategy-call').amountCad * 100)},
];
async function resolveDirectSquareOrder(orderId:string,payment:any):Promise<SquareOrder|null>{
  const token=process.env.SQUARE_ACCESS_TOKEN?.trim()||'';
  const response=await fetch('https://connect.squareup.com/v2/orders/'+encodeURIComponent(orderId),{
    headers:{Authorization:'Bearer '+token,'Square-Version':'2026-09-16'},
    signal:AbortSignal.timeout(10000),cache:'no-store'});
  if(!response.ok)throw new Error('Square order verification failed: '+response.status);
  const {order}=await response.json();
  const items=Array.isArray(order?.line_items)?order.line_items:[];
  if(items.length!==1)return null;
  const item=items[0];
  const product=DIRECT_SQUARE_PRODUCTS.find(entry=>entry.name===String(item?.name||''));
  if(!product||item?.base_price_money?.currency!=='CAD'||Number(item?.base_price_money?.amount)!==product.expected_amount)return null;
  const email=String(payment?.buyer_email_address||'').trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email))return null;
  let customer:any=null;
  const customerId=String(payment?.customer_id||'');
  if(customerId){
    const customerResponse=await fetch('https://connect.squareup.com/v2/customers/'+encodeURIComponent(customerId),{
      headers:{Authorization:'Bearer '+token,'Square-Version':'2026-09-16'},
      signal:AbortSignal.timeout(10000),cache:'no-store'});
    if(customerResponse.ok)customer=(await customerResponse.json()).customer;
  }
  const address=payment?.billing_address||{};
  const customerName=[customer?.given_name||address?.first_name,customer?.family_name||address?.last_name].filter(Boolean).join(' ').trim();
  const name=customerName||email;
  const registrationId='square-direct-'+createHash('sha256').update(orderId).digest('hex').slice(0,32);
  return {email,name,phone:String(customer?.phone_number||''),class_name:product.name,class_id:product.class_id,
    registration_id:registrationId,order_id:orderId,expected_amount:product.expected_amount,
    payment_status:'unpaid',is_test:false,created_at:new Date().toISOString()};
}
async function upsertAmandaClientRecord(order:SquareOrder, paidAt:string){
  const formula=`AND({Email}='${escapeAirtableString(order.email)}',{Portal Slug}='amanda-catherine')`;
  const current=await airtableQuery('Client Records',{filterByFormula:formula,maxRecords:1});
  const fields={
    'Client Name':order.name||order.email,
    Organization:'AesthetiKine Studio Lab',
    Email:order.email,
    Phone:order.phone||'',
    'Portal Slug':'amanda-catherine',
    'Portal Access Status':'Active',
    'Payment Received At':paidAt,
    'Commerce Offer Id':'amanda-course-'+order.class_id,
  };
  const saved=current[0]?await airtableUpdate('Client Records',current[0].id,fields,true):await airtableCreate('Client Records',fields,true);
  if(!saved)throw new Error('Amanda Client Records entry could not be saved');
}
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
    let order=await loadStudioRecord<SquareOrder>('experience',id);
    const isDirectSquareLink=!order;
    if(isDirectSquareLink){
      order=await resolveDirectSquareOrder(orderId,payment);
      if(!order)return NextResponse.json({ok:false,error:'Square payment does not match a configured Amanda course product'},{status:409});
      const saved=await saveStudioRecord({recordType:'experience',id,organizationId:syntheticOrgId('amanda-catherine'),
        title:'Amanda Square direct-link order',payload:order});
      if(!saved.ok||!saved.persistedToAirtable)throw new Error(saved.error||'Square order correlation could not be saved');
    }
    if(!order||order.order_id!==orderId||order.is_test!==false)
      return NextResponse.json({ok:false,error:'Unknown Square registration order'},{status:409});
    if(payment.amount_money?.currency!=='CAD'||(!isDirectSquareLink&&Number(payment.amount_money?.amount)!==order.expected_amount)||
       (isDirectSquareLink&&Number(payment.amount_money?.amount)<order.expected_amount))
      return NextResponse.json({ok:false,error:'Square payment amount differs from checkout'},{status:409});
    if(isDirectSquareLink){
      const signup=await registerBrickEvent({brick_type:'checkout',brick_id:order.class_id,client_id:'amanda-catherine',
        registration_id:order.registration_id,name:order.name||order.email,email:order.email,phone:order.phone||'',
        status:'checkout_started',payment_status:'unpaid',payment_reference:null,
        timestamp:order.created_at,source:'square-payment-link',is_test:false});
      if(!signup.ok)throw new Error(signup.error||'Square payment registration could not be created');
    }
    if(order.payment_reference && order.payment_reference!==paymentId)
      return NextResponse.json({ok:false,error:'Conflicting payment on registration'},{status:409});
    const verifiedPayment={
      event_type:'payment_confirmed' as const,registration_id:order.registration_id,email:order.email,
      class_id:order.class_id,payment_status:'paid' as const,payment_reference:paymentId,
      payment_provider:'square' as const,timestamp:String(payment.updated_at||new Date().toISOString()),is_test:false,
    };
    const tracked=await registerBrickEvent({
      brick_type:'payments',brick_id:order.class_id,client_id:'amanda-catherine',
      registration_id:order.registration_id,name:order.name||order.email,email:order.email,
      phone:'',status:'payment_confirmed',payment_status:'paid',payment_reference:paymentId,
      timestamp:verifiedPayment.timestamp,source:'square-amanda-webhook',is_test:false,
    },verifiedPayment);
    if(!tracked.ok)throw new Error(tracked.error||'Verified Square tracking failed');
    await upsertAmandaClientRecord(order,String(payment.updated_at||new Date().toISOString()));
    const purchasedProduct=DIRECT_SQUARE_PRODUCTS.find(entry=>entry.class_id===order!.class_id);
    if(purchasedProduct?.course_id){
      const access=await provisionAmandaClientAccess({
        email:order.email,name:order.name,audience:'student-trainee',
        amountPaidCad:order.expected_amount/100,transactionId:paymentId,
        courseIds:[purchasedProduct.course_id],
      });
      if(!access.ok)throw new Error(access.error||'Amanda course access could not be assigned');
    }
    let next:SquareOrder={...order,payment_status:'paid',payment_reference:paymentId,
      receipt_url:typeof payment.receipt_url==='string' && payment.receipt_url.startsWith('https://') ? payment.receipt_url : undefined,
      paid_amount_cad:Number(payment.amount_money?.amount||order.expected_amount)/100,
      paid_at:String(payment.updated_at||new Date().toISOString())};
    if(!order.confirmation_sent){
      const letter=await getAmandaConfirmationLetter('live');
      const firstName=(order.name||order.email).split(' ')[0];
      const body=letter.body_html.replace(/{{first_name}}/g,safe(firstName))
        .replace(/{{class_name}}/g,safe(order.class_name||order.class_id));
      const learningUrl='https://amandacatherine.ca/portal/amanda-catherine/enrollment-success?provider=square&ref='+encodeURIComponent(paymentId);
      const receiptUrl=typeof payment.receipt_url==='string' && payment.receipt_url.startsWith('https://') ? payment.receipt_url : '';
      const amount=(Number(payment.amount_money?.amount || order.expected_amount)/100).toFixed(2);
      const premiumHtml=body+'<h3>Welcome to AesthetiKine Academy</h3>'+
        '<p>Paid CAD '+amount+'. Payment reference: '+safe(paymentId)+'</p>'+
        '<ol><li>Sign in using your email code.</li><li>Open Learning and select '+safe(order.class_name||order.class_id)+'.</li>'+
        '<li>Start Module 1 and find available workbooks, protocols, and resources in your course.</li></ol>'+
        '<p><a href="'+learningUrl+'">Access learning</a></p>'+
        (receiptUrl?'<p><a href="'+safe(receiptUrl)+'">View Square receipt</a></p>':'')+
        '<p>Need help? Open Support in the Amanda Catherine portal.</p>';
      const sent=await sendAmandaPremiumReceiptEmail({
        to:order.email,subject:"You're in — Your "+(order.class_name||order.class_id)+" is Ready ✨",
        html:premiumHtml,
        text:'Thank you. Your '+(order.class_name||order.class_id)+' payment is confirmed, CAD '+amount+'. Reference: '+paymentId+'. Access learning: '+learningUrl,
        idempotencyKey:'amanda-square-welcome-'+paymentId,
        receipt:{
          customer:order.name||order.email,
          program:order.class_name||order.class_id,
          amountCad:Number(payment.amount_money?.amount||order.expected_amount)/100,
          provider:'Square',reference:paymentId,
          paidAt:String(payment.updated_at||new Date().toISOString()),
          isTest:false,
        },
      });
      if(!sent.ok)throw new Error(sent.error||'Amanda letter delivery failed');
      next={...next,confirmation_sent:true};
    }
    if(!order.owner_notification_sent){
      const ownerEmail=await sendAuthEmail({
        to:'amandacatherinec@gmail.com',
        subject:'New paid enrollment — '+(order.class_name||order.class_id),
        title:'AesthetiKine enrollment received',
        brandLabel:'Amanda Catherine · AesthetiKine',brandColor:'#596b5b',
        bodyHtml:'<p>A verified Square enrollment was completed for '+safe(order.class_name||order.class_id)+
          '.</p><p>Client: '+safe(order.name||order.email)+' ('+safe(order.email)+
          ')</p><p>Payment reference: '+safe(paymentId)+'</p><p>Review your Amanda owner portal for follow-up.</p>',
      });
      if(!ownerEmail.ok)throw new Error(ownerEmail.error||'Owner notification failed');
      next={...next,owner_notification_sent:true};
    }
    const saved=await saveStudioRecord({recordType:'experience',id,
      organizationId:syntheticOrgId('amanda-catherine'),title:'Amanda Square verified payment',
      payload:next});
    if(!saved.ok || !saved.persistedToAirtable)throw new Error(saved.error||'Square confirmation state not saved');
    return NextResponse.json({ok:true,updated:true,payment_reference:paymentId});
  }catch(error){
    console.error('[Amanda Square webhook]',error);
    // Return non-2xx so Square can retry a temporary storage or email failure.
    return NextResponse.json({ok:false,error:'Square payment tracking deferred'},{status:503});
  }
}
