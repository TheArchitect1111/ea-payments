import { NextRequest, NextResponse } from 'next/server';
import { mockEnabled,verifyMock } from '@/lib/amanda-catherine/frappe-bridge-mock';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!mockEnabled())return NextResponse.json({error:'Not found'},{status:404});
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Forbidden'},{status:403});
 let token='';try{token=(await req.json()).token}catch{return NextResponse.json({error:'Invalid input'},{status:400})}
 const result=verifyMock(token);
 return NextResponse.json({email:result.email,courseAccess:result.courseAccess},{status:result.courseAccess?200:403,headers:{'Cache-Control':'no-store'}});
}
