import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    let courseId='', amandaCourseId='', paymentOption='', portalSlug='amanda-catherine';
    const ct=req.headers.get('content-type')||'';
    if(ct.includes('form-urlencoded')||ct.includes('form-data')){
      const fd=await req.formData(); courseId=String(fd.get('courseId')||''); amandaCourseId=String(fd.get('amandaCourseId')||''); paymentOption=String(fd.get('paymentOption')||''); portalSlug=String(fd.get('portalSlug')||'amanda-catherine');
    }else{ try{ const b=await req.json(); courseId=b.courseId||''; amandaCourseId=b.amandaCourseId||''; paymentOption=b.paymentOption||''; portalSlug=b.portalSlug||''; }catch{ const t=await req.text(); if(t.includes('courseId=')){ const p=new URLSearchParams(t); courseId=p.get('courseId')||''; amandaCourseId=p.get('amandaCourseId')||''; paymentOption=p.get('paymentOption')||''; }}}
    if(!courseId) return NextResponse.json({error:'Missing courseId'},{status:400});
    const origin=req.headers.get('origin')||`https://${req.headers.get('host')}`||'';
    const isTest=courseId.startsWith('test-')||paymentOption==='test';
    if(isTest){
      const successUrl=`${origin}/portal/amanda-catherine/learning/${courseId}?success=true&test_bypass=true`;
      if(ct.includes('form-urlencoded')||ct.includes('form-data')) return NextResponse.redirect(successUrl,303);
      return NextResponse.json({url:successUrl,bypass:true});
    }
    return NextResponse.json({error:'Live checkout not enabled in Preview'},{status:400});
  }catch(e:any){ return NextResponse.json({error:e.message||'Checkout failed'},{status:500}); }
}
