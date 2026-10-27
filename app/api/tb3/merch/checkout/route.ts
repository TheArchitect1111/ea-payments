import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { resolveTb3Cart } from '@/lib/tb3/merch-cart';
import { tb3Printful } from '@/lib/tb3/printful-client';
import { auditTb3PrintfulCatalog } from '@/lib/tb3/printful-catalog-audit';
import { getStripeMerchantStatus } from '@/lib/bricks/merchant-onboarding/stripe-connect';
import { stripeMerchantStore } from '@/lib/bricks/merchant-onboarding/stripe-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fail closed until live Connect onboarding, webhook and Printful fulfillment are certified.
const enabled = () => process.env.VERCEL_ENV === 'production'
  && process.env.TB3_MERCH_CHECKOUT_ENABLED === 'true'
  && !!process.env.EA_STRIPE_CONNECT_SECRET_KEY?.startsWith('sk_live_')
  && !!process.env.EA_STRIPE_CONNECT_WEBHOOK_SECRET
  && !!process.env.EA_MERCHANT_DATABASE_URL
  && !!process.env.PRINTFUL_API_KEY?.trim()
  && !!process.env.TB3_MERCH_DRAFT_FULFILLMENT_APPROVED
  && process.env.TB3_MERCH_DRAFT_FULFILLMENT_APPROVED === 'true'
  && process.env.TB3_MERCH_AUTO_FULFILLMENT_APPROVED === 'true'
  && process.env.TB3_PRINTFUL_FUNDING_VERIFIED === 'true'
  && process.env.TB3_PRINTFUL_CATALOG_VERIFIED === 'true'
  && Number.isSafeInteger(Number(process.env.TB3_MERCH_MAX_PRINTFUL_COST_CENTS))
  && Number(process.env.TB3_MERCH_MAX_PRINTFUL_COST_CENTS) > 0;

const schema = z.object({
  cart: z.unknown(),
  attribution: z.enum(['instagram', 'direct']).optional(),
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

export async function GET() {
  return NextResponse.json({available: enabled()}, {
    headers: {'Cache-Control': 'no-store'},
  });
}

export async function POST(req: NextRequest) {
  const reply = (payload: unknown, status = 200) =>
    NextResponse.json(payload, {status, headers: {'Cache-Control': 'no-store'}});
  if (req.headers.get('origin') !== req.nextUrl.origin)
    return reply({error: 'Request origin denied.'}, 403);
  if (!enabled())
    return reply({error: 'TB3 secure merchandise checkout is not yet available.'}, 503);
  try {
    const raw = await req.text();
    if (raw.length > 20000) return reply({error: 'Request too large.'}, 413);
    const input = schema.parse(JSON.parse(raw));
    const lines = resolveTb3Cart(input.cart);
    // An owner attestation alone is insufficient: verify the live Printful
    // store before creating any customer or paid Stripe Checkout session.
    const liveCatalog = await auditTb3PrintfulCatalog();
    if (!liveCatalog.verified)
      return reply({error: 'TB3 merchandise catalog verification is incomplete.'}, 503);
    const rates = await tb3Printful<ShippingRate[]>('/shipping/rates', {
      method: 'POST',
      body: JSON.stringify({
        recipient: input.recipient,
        currency: 'USD',
        items: lines.map(line => ({
          variant_id: line.catalogVariantId,
          quantity: line.quantity,
          value: (line.unitAmount / 100).toFixed(2),
        })),
      }),
    });
    const valid = rates.filter(rate => rate.currency === 'USD'
      && Number.isFinite(Number(rate.rate)) && Number(rate.rate) >= 0
      && !!rate.id);
    if (!valid.length) return reply({error: 'Shipping is unavailable.'}, 503);
    const shipping = valid.reduce((a,b) => Number(a.rate) <= Number(b.rate) ? a : b);
    const shippingCents = Math.round(Number(shipping.rate) * 100);
    if (!Number.isSafeInteger(shippingCents))
      return reply({error: 'Shipping could not be calculated.'}, 503);

    const merchant = await getStripeMerchantStatus('tarris', stripeMerchantStore);
    if (merchant.status !== 'ready' || !merchant.providerMerchantReference ||
        !merchant.chargesEnabled || !merchant.payoutsEnabled)
      return reply({error: 'TB3 merchant onboarding is incomplete.'}, 503);
    const stripe = new Stripe(process.env.EA_STRIPE_CONNECT_SECRET_KEY!);
    const connectedAccount = {stripeAccount: merchant.providerMerchantReference};
    // Prepopulate the same verified destination for Stripe Tax and Printful.
    // No changes to the delivery address during Stripe Checkout.
    const customer = await stripe.customers.create({
      email: input.email,
      name: input.recipient.name,
      address: {
        line1: input.recipient.address1,
        line2: input.recipient.address2,
        city: input.recipient.city,
        state: input.recipient.state_code,
        country: input.recipient.country_code,
        postal_code: input.recipient.zip,
      },
      shipping: {
        name: input.recipient.name,
        address: {
          line1: input.recipient.address1,
          line2: input.recipient.address2,
          city: input.recipient.city,
          state: input.recipient.state_code,
          country: input.recipient.country_code,
          postal_code: input.recipient.zip,
        },
      },
    }, connectedAccount);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: lines.map(line => ({
        quantity: line.quantity,
        price_data: {
          currency: 'usd', unit_amount: line.unitAmount,
          product_data: {name: line.name + ' · ' + line.size},
        },
      })),
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {amount: shippingCents, currency: 'usd'},
          display_name: shipping.name.slice(0, 100) || 'Printful shipping',
        },
      }],
      automatic_tax: {enabled: true},
      metadata: {
        type: 'tb3_merch',
        attribution_source: input.attribution || 'direct',
        tenant_id: 'tarris',
        destination: JSON.stringify(input.recipient),
        variant_quantities: JSON.stringify(lines.map(x => [x.variantId, x.quantity])),
        fulfillment: 'pending_verified_webhook',
        printful_shipping: shipping.id,
      },
      success_url: 'https://tb3.online/tarris?merch_checkout=success#merch',
      cancel_url: 'https://tb3.online/tarris?merch_checkout=cancelled#merch',
    }, connectedAccount);
    if (!session.url) return reply({error: 'Secure checkout unavailable.'}, 503);
    return reply({url: session.url});
  } catch (error) {
    console.error('[tb3-merch] checkout could not be created',
      error instanceof Error ? error.name : 'Unknown');
    return reply({error: 'Unable to create secure checkout.'}, 503);
  }
}
