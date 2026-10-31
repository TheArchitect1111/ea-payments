import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  let courseId=''; let paymentOption=''; const ct=req.headers.get('content-type')||'';
  if(ct.includes('form-urlencoded')||ct.includes('form-data')){ const fd=await req.formData(); courseId=String(fd.get('courseId')||''); paymentOption=String(fd.get('paymentOption')||''); }
  else{ try{ const b=await req.json(); courseId=b.courseId||''; paymentOption=b.paymentOption||''; }catch{ const t=await req.text(); if(t.includes('courseId=')){ const p=new URLSearchParams(t); courseId=p.get('courseId')||''; paymentOption=p.get('paymentOption')||''; }}}
  const origin=req.nextUrl.origin; const isTest=courseId.startsWith('test-')||paymentOption==='test'||req.nextUrl.searchParams.get('test')==='1'||courseId==='firm-foundation';
  const successUrl=`${origin}/amanda-catherine/enroll/${courseId}?test=${isTest?'1':'0'}&success=true&paid=1`;
  if(ct.includes('form-urlencoded')||ct.includes('form-data')) return NextResponse.redirect(successUrl,303);
  return NextResponse.json({url: successUrl});
}
