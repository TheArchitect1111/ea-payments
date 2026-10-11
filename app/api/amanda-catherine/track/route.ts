import {NextRequest,NextResponse} from 'next/server';
import {registerAmandaClick} from '@/lib/amanda-catherine/brick-events';
import {amandaCtaKey,isAmandaSource,isAmandaDestination} from '@/lib/amanda-catherine/tracking';
import {isAllowedAmandaOrigin} from '@/lib/amanda-catherine/request-origin';
import {checkRateLimit} from '@/lib/ai/rate-limit';
import {z} from 'zod';
export const dynamic='force-dynamic';export const revalidate=0;
const clickSchema=z.object({event:z.literal('cta_click'),portal_slug:z.literal('amanda-catherine'),
 event_id:z.string().uuid(),visitor_id:z.string().uuid(),cta_key:z.string().max(100),cta_name:z.string().trim().min(1).max(200),
 page:z.string().max(500),destination:z.string().max(2000),timestamp:z.string().datetime({offset:true}),course_key:z.string().max(128).optional()}).strict();
export async function POST(req:NextRequest) {
 try {
  if(!isAllowedAmandaOrigin(req))return NextResponse.json({ok:false,error:'Invalid request origin'},{status:403});
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  if(!checkRateLimit('amanda-click:'+ip,120,60000).ok)return NextResponse.json({ok:false,error:'Please wait a moment.'},{status:429});
  const text=await req.text();if(text.length>5000)return NextResponse.json({ok:false,error:'Event too large'},{status:413});
  const value=clickSchema.parse(JSON.parse(text));
  if(!isAmandaSource(value.page)||!isAmandaDestination(value.destination)||value.cta_key!==amandaCtaKey(value.cta_key))return NextResponse.json({ok:false,error:'Invalid CTA details'},{status:400});
  const {event,portal_slug,...click}=value;
  const result=await registerAmandaClick(click,process.env.VERCEL_ENV==='preview');
  return NextResponse.json({...result,event_id:value.event_id},{status:result.ok?200:503,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  if(error instanceof z.ZodError||error instanceof SyntaxError)return NextResponse.json({ok:false,error:'Invalid tracking event'},{status:400});
  console.error('[Amanda CTA tracking]',error);return NextResponse.json({ok:false,error:'CTA tracking is temporarily unavailable'},{status:503});
 }
}
