import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveTrackingLead, storeTrackingPayment } from '@/lib/services/trackingPortal';

export const dynamic='force-dynamic';
export const revalidate=0;

const SignupSchema=z.object({
  event_type:z.literal('signup').optional(),
  first_name:z.string().trim().min(1).max(80),last_name:z.string().trim().max(80).default(''),
  email:z.string().trim().email().max(254),phone:z.string().trim().max(40).default(''),
  class_name:z.string().trim().min(1).max(200),class_id:z.string().trim().min(1).max(120),
  registration_type:z.enum(['live','waitlist']),created_at:z.string().datetime().optional(),
  source_page:z.literal('amandacatherine.ca'),registration_id:z.string().max(120).optional(),
  payment_status:z.enum(['unpaid','paid']).optional(),payment_reference:z.string().nullable().optional(),
  timestamp:z.string().datetime().optional(),source:z.string().max(250).optional(),is_test:z.literal(false).optional(),
});
const PaymentSchema=z.object({
  event_type:z.literal('payment_confirmed'),
  registration_id:z.string().max(120).optional(),
  email:z.string().trim().email().max(254),class_id:z.string().trim().min(1).max(120),
  payment_status:z.literal('paid'),payment_reference:z.string().trim().min(1).max(250),
  payment_provider:z.enum(['square','stripe']),timestamp:z.string().datetime(),
  is_test:z.literal(false).optional(),
});
function authorized(req:NextRequest){
  const expected=process.env.INGEST_API_KEY?.trim() || process.env.TRACKING_PORTAL_API_KEY?.trim() || '';
  const received=req.headers.get('x-api-key') || '';
  if(!expected || !received)return false;
  const left=Buffer.from(expected),right=Buffer.from(received);
  return left.length===right.length && timingSafeEqual(left,right);
}
export async function POST(req:NextRequest){
  if(!authorized(req))return NextResponse.json({ok:false,error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null);
  try{
    if(body?.event_type==='payment_confirmed'){
      const parsed=PaymentSchema.safeParse(body);
      if(!parsed.success)return NextResponse.json({ok:false,error:'Invalid payment event'},{status:400});
      const saved=await storeTrackingPayment({...parsed.data,is_test:false});
      return NextResponse.json({ok:true,id:saved.id,event_type:'payment_confirmed'});
    }
    const parsed=SignupSchema.safeParse(body);
    if(!parsed.success)return NextResponse.json({ok:false,error:'Invalid signup event'},{status:400});
    const lead=parsed.data;
    const saved=await saveTrackingLead({...lead,created_at:lead.created_at||new Date().toISOString(),is_test:false});
    return NextResponse.json({ok:true,id:saved.id,registration_type:lead.registration_type});
  }catch(error){
    console.error('[lead-ingest] persistence failed',error);
    return NextResponse.json({ok:false,error:'Tracking storage unavailable or registration missing'},{status:503});
  }
}
