import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { mintMock, mockAllowed, mockEnabled } from '@/lib/amanda-catherine/frappe-bridge-mock';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!mockEnabled())return NextResponse.json({error:'Not found'},{status:404});
 const cookie=(await cookies()).get(EA_PORTAL_COOKIE)?.value;
 const session=cookie?await verifySession(cookie):null;
 if(!session||session.slug!=='amanda-catherine'||!session.email||!mockAllowed(session.email))return NextResponse.json({error:'Forbidden'},{status:403});
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Forbidden'},{status:403});
 let courseId='';try{courseId=(await req.json()).courseId}catch{return NextResponse.json({error:'Invalid input'},{status:400})}
 try{return NextResponse.json({token:mintMock(session.email,courseId)},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Forbidden'},{status:403})}
}
