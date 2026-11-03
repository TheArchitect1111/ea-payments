import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  let courseId=''; let paymentOption=''; const ct=req.headers.get('content-type')||'';
  if(ct.includes('form-urlencoded')||ct.includes('form-data')){ const fd=await req.formData(); courseId=String(fd.get('courseId')||''); paymentOption=String(fd.get('paymentOption')||''); }
  else{ try{ const b=await req.json(); courseId=b.courseId||''; paymentOption=b.paymentOption||''; }catch{ const t=await req.text(); const p=new URLSearchParams(t); courseId=p.get('courseId')||''; }}
  const origin=req.nextUrl.origin; const isTest=paymentOption==='test'||req.nextUrl.searchParams.get('test')==='1'; const successUrl=`${origin}/amanda-catherine/enroll/${courseId}?test=${isTest?'1':'0'}&success=true&paid=1`;
  const token=process.env.SQUARE_ACCESS_TOKEN||''; const loc=process.env.SQUARE_LOCATION_ID||'';
  if(!token||!loc){ if(ct.includes('form-urlencoded')||ct.includes('form-data')) return NextResponse.redirect(successUrl,303); return NextResponse.json({url:successUrl}); }
  const base=process.env.SQUARE_ENV==='production'?'https://connect.squareup.com':'https://connect.squareupsandbox.com';
  const amount=isTest?100:10000;
  const res=await fetch(`${base}/v2/online-checkout/payment-links`,{method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json','Square-Version':'2024-12-18'},body:JSON.stringify({idempotency_key:`${courseId}-${Date.now()}`,quick_pay:{name:`${isTest?'[TEST $1] ':''}${courseId}`,price_money:{amount,currency:'CAD'},location_id:loc},checkout_options:{redirect_url:successUrl,ask_for_shipping_address:false}})});
  const data=await res.json(); const url=data.payment_link?.url||successUrl;
  if(ct.includes('form-urlencoded')||ct.includes('form-data')) return NextResponse.redirect(url,303);
  return NextResponse.json({url});
}
