import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  let courseId=''; try{ const b=await req.json(); courseId=b.courseId||''; }catch{ const t=await req.text(); if(t.includes('courseId=')){ const p=new URLSearchParams(t); courseId=p.get('courseId')||''; }}
  const origin=req.nextUrl.origin;
  return NextResponse.json({url: `${origin}/portal/amanda-catherine/learning/${courseId}?success=true&paid=1`});
}
