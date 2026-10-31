import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    let courseId='', portalSlug='amanda-catherine';
    const ct=req.headers.get('content-type')||'';
    if(ct.includes('form-urlencoded')||ct.includes('form-data')){
      const fd=await req.formData(); courseId=String(fd.get('courseId')||'');
    }else{ try{ const b=await req.json(); courseId=b.courseId||''; }catch{ const t=await req.text(); if(t.includes('courseId=')){ const p=new URLSearchParams(t); courseId=p.get('courseId')||''; }}}
    if(!courseId) return NextResponse.json({error:'Missing courseId'},{status:400});
    const origin = req.nextUrl.origin;
    const successUrl = `${origin}/portal/amanda-catherine/learning/${courseId}?success=true&paid=1`;
    if(ct.includes('form-urlencoded')||ct.includes('form-data')) return NextResponse.redirect(successUrl, 303);
    return NextResponse.json({url: successUrl});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500}); }
}
