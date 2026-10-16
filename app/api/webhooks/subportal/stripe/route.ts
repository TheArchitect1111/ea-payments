import {NextRequest,NextResponse} from 'next/server';
import Stripe from 'stripe';
import {getStripe} from '@/lib/stripe';
import {fulfillSubportalStripe} from '@/lib/subportal/fulfillment';

export const dynamic='force-dynamic';

/** One platform-wide Stripe endpoint for all manifest-installed Subportal tenants. */
export async function POST(req:NextRequest){
  const secret=process.env.SUBPORTAL_STRIPE_WEBHOOK_SECRET;
  if(!secret || !process.env.STRIPE_SECRET_KEY)
    return NextResponse.json({error:'Subportal Stripe webhook is not configured'},{status:503});
  const raw=await req.text();
  let event:Stripe.Event;
  try{
    event=getStripe().webhooks.constructEvent(raw,req.headers.get('stripe-signature')||'',secret);
  }catch{
    return NextResponse.json({error:'Invalid Stripe webhook signature'},{status:400});
  }
  if(event.type!=='checkout.session.completed' && event.type!=='checkout.session.async_payment_succeeded')
    return NextResponse.json({received:true,ignored:true});
  const session=event.data.object as Stripe.Checkout.Session;
  if(session.metadata?.subportalBrick!=='v1')
    return NextResponse.json({received:true,ignored:true});
  if(event.type==='checkout.session.completed' && session.payment_status!=='paid')
    return NextResponse.json({received:true,pending:true});
  try{
    await fulfillSubportalStripe(session);
    return NextResponse.json({received:true,fulfilled:true});
  }catch(error){
    console.error('[subportal] Stripe fulfillment error',error);
    return NextResponse.json({error:'Subportal Stripe fulfillment failed; retry required'},{status:503});
  }
}
