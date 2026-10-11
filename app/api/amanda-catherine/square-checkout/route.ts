import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { registry } from '@/lib/amanda-catherine/registry';
import { isAllowedAmandaOrigin } from '@/lib/amanda-catherine/request-origin';
import { airtableQuery } from '@/lib/data/airtable-client';
import { saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

export const dynamic='force-dynamic';
const API='https://connect.squareup.com';
const VERSION='2026-09-16';
function escapeFormula(s:string){return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
export async function POST(req:NextRequest){
  if(!isAllowedAmandaOrigin(req))return NextResponse.json({ok:false,error:'Invalid origin'},{status:403});
  const body=await req.json().catch(()=>({}));
  const email=String(body.email||'').trim().toLowerCase();
  const classId=String(body.class_id||body.courseId||'').trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !/^[a-zA-Z0-9_-]{2,120}$/.test(classId))
    return NextResponse.json({ok:false,error:'A prior valid registration is required'},{status:400});
  const key=email+':'+classId;
  const token=process.env.SQUARE_ACCESS_TOKEN?.trim();
  const location=process.env.SQUARE_LOCATION_ID?.trim();
  if(!token||!location)return NextResponse.json({ok:false,error:'Square checkout integration is not configured'},{status:503});
  try{
    const leads=await airtableQuery('portal_registrations',{filterByFormula:"{registration_key}='"+escapeFormula(key)+"'",maxRecords:1});
    if(!leads[0])return NextResponse.json({ok:false,error:'Complete registration before payment'},{status:409});
    const course=(await registry()).courses.find(c=>c.key===classId && (c.status==='LIVE'||c.status==='READY') && !c.isTest);
    if(!course || typeof course.price!=='number'||course.price<=0)
      return NextResponse.json({ok:false,error:'This course is not available for Square payment'},{status:409});
    const id=createHash('sha256').update(key).digest('hex').slice(0,32);
    const amount=Math.round(course.price*100);
    const res=await fetch(API+'/v2/online-checkout/payment-links',{
      method:'POST',headers:{Authorization:'Bearer '+token,'Square-Version':VERSION,'Content-Type':'application/json'},
      body:JSON.stringify({
        idempotency_key:'amanda-'+id,quick_pay:{name:course.title,price_money:{amount,currency:'CAD'},location_id:location},
        payment_note:'EA-AMANDA:'+id,pre_populated_data:{buyer_email:email},
      }),signal:AbortSignal.timeout(12000),cache:'no-store'});
    const out=await res.json().catch(()=>({}));
    if(!res.ok||!out.payment_link?.order_id||!out.payment_link?.url)
      throw new Error('Square could not create a checkout link: '+res.status);
    const url=new URL(String(out.payment_link.url));
    if(url.protocol!=='https:'|| !['square.link','checkout.square.site'].includes(url.hostname))
      throw new Error('Square returned an unexpected checkout host');
    const orderId=String(out.payment_link.order_id);
    const saved=await saveStudioRecord({recordType:'experience',id:'amanda-square-order-'+orderId,
      organizationId:syntheticOrgId('amanda-catherine'),title:'Amanda Square pending order',
      payload:{email,class_id:classId,registration_id:id,order_id:orderId,expected_amount:amount,
        payment_status:'unpaid',is_test:false,created_at:new Date().toISOString()}});
    if(!saved.ok)throw new Error(saved.error||'Square order correlation could not be saved');
    return NextResponse.json({ok:true,url:url.toString(),registration_id:id});
  }catch(error){
    console.error('[Amanda Square checkout]',error);
    return NextResponse.json({ok:false,error:'Square checkout is currently unavailable'},{status:503});
  }
}
