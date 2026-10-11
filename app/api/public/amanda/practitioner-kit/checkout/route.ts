import { amandaKitCheckout, type AmandaKitSelection } from '@/lib/amanda-catherine/kit-fulfillment';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { AMANDA_PRACTITIONER_KIT } from '@/lib/amanda-catherine/practitioner-kit-catalog';
import {registerAmandaCheckout} from '@/lib/amanda-catherine/payments';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const browserOrigin = request.headers.get('origin');
  const origin = browserOrigin === requestOrigin || ['https://amandacatherine.ca','https://www.amandacatherine.ca'].includes(browserOrigin||'') ? browserOrigin : null;
  if (!origin) return NextResponse.json({error:'Please open checkout from the private purchase page.'},{status:403});
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`amanda-kit-checkout:${ip}`,6,60_000).ok) return NextResponse.json({error:'Please wait one minute before trying again.'},{status:429});
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({error:'Secure checkout is temporarily unavailable. Please try again later.'},{status:503});
  let kit;
  const body=await request.json().catch(()=>({})) as AmandaKitSelection&{name?:string;email?:string;phone?:string};
  const name=String(body.name||'').trim().slice(0,120),email=String(body.email||'').trim().toLowerCase().slice(0,254);
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:'Enter your name and a valid email.'},{status:400});
  try { kit = await amandaKitCheckout(body); } catch(error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Kit selection is invalid.' }, { status: 409 }); }
  const registrationId=crypto.randomUUID();
  const metadata = {...kit.metadata,portalSlug:'amanda-catherine',checkoutType:'amanda-practitioner-kit',amandaKitId:AMANDA_PRACTITIONER_KIT.id,registrationId,clientName:name,clientEmail:email};
  try {
    await registerAmandaCheckout({registrationId,brickId:AMANDA_PRACTITIONER_KIT.id,name,email,phone:String(body.phone||'').slice(0,40),
      source:'/amanda-catherine/private/practitioner-kit',isTest:process.env.VERCEL_ENV==='preview'});
    const session = await getStripe().checkout.sessions.create({
      mode:'payment',payment_method_types:['card'],customer_creation:'always',
      billing_address_collection:'required',phone_number_collection:{enabled:true},
      customer_email:email,
      shipping_options:kit.shippingOptions,
      invoice_creation:{enabled:true},metadata,payment_intent_data:{metadata},
      line_items:[{quantity:1,price_data:{currency:'cad',unit_amount:AMANDA_PRACTITIONER_KIT.priceCad * 100,
        product_data:{name:AMANDA_PRACTITIONER_KIT.name,description:AMANDA_PRACTITIONER_KIT.description}}}],
      success_url:`${origin}/amanda-catherine/private/practitioner-kit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${origin}/amanda-catherine/private/practitioner-kit?payment=cancelled`,
    });
    if (!session.url) throw new Error('No hosted checkout URL');
    return NextResponse.json({ok:true,url:session.url});
  } catch(error) {
    console.error('[amanda-kit] checkout creation failed',error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({error:'Secure checkout could not be opened. Please try again.'},{status:502});
  }
}
