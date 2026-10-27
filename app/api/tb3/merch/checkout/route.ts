import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { resolveTb3Cart } from '@/lib/tb3/merch-cart';
import { tb3Printful } from '@/lib/tb3/【entity-printful¦canonical_name=Printful】-client';
import { auditTb3PrintfulCatalog } from '@/lib/tb3/【entity-printful¦canonical_name=Printful】-catalog-audit';
import { getDirectConnection } from '@/lib/bricks/merchant-onboarding/stripe-store';
import { verifyDirectAccount } from '@/lib/bricks/merchant-onboarding/stripe-direct';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const enabled = () => {
  if (process.env.VERCEL_ENV === 'preview') {
    return !!process.env.TB3_STRIPE_SECRET_KEY?.startsWith('sk_test_') && !!process.env.EA_MERCHANT_DATABASE_URL;
  }
  return process.env.VERCEL_ENV === 'production' && process.env.TB3_MERCH_CHECKOUT_ENABLED === 'true' && !!process.env.TB3_STRIPE_SECRET_KEY?.startsWith('sk_live_') && !!process.env.TB3_STRIPE_WEBHOOK_SECRET;
};
const schema = z.object({
  cart: z.unknown(),
  attribution: z.enum(['instagram','direct']).optional(),
  email: z.string().email().max(254),
  recipient: z.object({
    name: z.string().trim().min(2).max(100),
    address1: z.string().trim().min(1).max(150),
    address2: z.string().trim().max(150).optional(),
    city: z.string().trim().min(1).max(100),
    state_code: z.string().trim().length(2),
    country_code: z.literal('US'),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  }).strict(),
}).strict();
type ShippingRate = { id: string; name: string; rate: string; currency: string };
export async function GET() { return NextResponse.json({available: enabled()}, {headers:{'Cache-Control':'no-store'}}); }
export async function POST(req: NextRequest) {
  const reply = (p: unknown, s=200) => NextResponse.json(p, {status:s,headers:{'Cache-Control':'no-store'}});
  if (req.headers.get('origin') !== req.nextUrl.origin) return reply({error:'Request origin denied.'},403);
  if (!enabled()) return reply({error:'TB3 secure merchandise checkout is not yet available.'},503);
  try {
    const raw = await req.text();
    if (raw.length > 20000) return reply({error:'Request too large.'},413);
    const input = schema.parse(JSON.parse(raw));
    const lines = resolveTb3Cart(input.cart);
    const liveCatalog = await auditTb3PrintfulCatalog();
    if (!liveCatalog.verified) return reply({error:'TB3 merchandise catalog verification is incomplete.'},503);
    const rates = await tb3Printful<ShippingRate[]>('/shipping/rates',{method:'POST',body:JSON.stringify({recipient:input.recipient,currency:'USD',items:lines.map(l=>({variant_id:l.catalogVariantId,quantity:l.quantity,value:(l.unitAmount/100).toFixed(2)}))})});
    const valid = rates.filter(r=>r.currency==='USD'&&Number.isFinite(Number(r.rate))&&Number(r.rate)>=0&&!!r.id);
    if (!valid.length) return reply({error:'Shipping is unavailable.'},503);
    const shipping = valid.reduce((a,b)=>Number(a.rate)<=Number(b.rate)?a:b);
    const shippingCents = Math.round(Number(shipping.rate)*100);
    const conn = await getDirectConnection('tarris');
    if (!conn?.stripe_account_id) return reply({error:'TB3 merchant onboarding incomplete - add Stripe Account ID.'},503);
    let verified;
    try { verified = await verifyDirectAccount(conn.stripe_account_id); } catch { return reply({error:'TB3 Stripe account verification failed.'},503); }
    if (!verified.ready) return reply({error:'TB3 merchant payouts not yet enabled.'},503);
    const stripe = new Stripe(process.env.TB3_STRIPE_SECRET_KEY!,{apiVersion:"2024-06-20" as any});
    const customer = await stripe.customers.create({email:input.email,name:input.recipient.name,address:{line1:input.recipient.address1,line2:input.recipient.address2,city:input.recipient.city,state:input.recipient.state_code,country:input.recipient.country_code,postal_code:input.recipient.zip},shipping:{name:input.recipient.name,address:{line1:input.recipient.address1,line2:input.recipient.address2,city:input.recipient.city,state:input.recipient.state_code,country:input.recipient.country_code,postal_code:input.recipient.zip}}});
    const session = await stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],customer:customer.id,line_items:lines.map(l=>({quantity:l.quantity,price_data:{currency:'usd',unit_amount:l.unitAmount,product_data:{name:l.name+' · '+l.size}}})),shipping_options:[{shipping_rate_data:{type:'fixed_amount',fixed_amount:{amount:shippingCents,currency:'usd'},display_name:shipping.name.slice(0,100)||'【entity-Printful¦canonical_name=Printful】 shipping'}}],automatic_tax:{enabled:true},metadata:{type:'tb3_merch',attribution_source:input.attribution||'direct',tenant_id:'tarris',destination:JSON.stringify(input.recipient),variant_quantities:JSON.stringify(lines.map(x=>[x.variantId,x.quantity])),fulfillment:'pending_verified_webhook',printful_shipping:shipping.id},success_url:'https://tb3.online/tarris?merch_checkout=success#merch',cancel_url:'https://tb3.online/tarris?merch_checkout=cancelled#merch'});
    if (!session.url) return reply({error:'Secure checkout unavailable.'},503);
    return reply({url:session.url});
  } catch (e) { console.error('[tb3-merch] checkout failed', e instanceof Error ? e.name : 'Unknown'); return reply({error:'Unable to create secure checkout.'},503); }
}
