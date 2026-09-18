import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { AMANDA_PRACTITIONER_KIT } from '@/lib/amanda-catherine/practitioner-kit-catalog';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') !== origin) return NextResponse.json({error:'Please open checkout from the private purchase page.'},{status:403});
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`amanda-kit-checkout:${ip}`,6,60_000).ok) return NextResponse.json({error:'Please wait one minute before trying again.'},{status:429});
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({error:'Secure checkout is temporarily unavailable. Please try again later.'},{status:503});
  const metadata = {portalSlug:'amanda-catherine',checkoutType:'amanda-practitioner-kit',amandaKitId:AMANDA_PRACTITIONER_KIT.id};
  try {
    const session = await getStripe().checkout.sessions.create({
      mode:'payment',payment_method_types:['card'],customer_creation:'always',
      billing_address_collection:'required',phone_number_collection:{enabled:true},
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
