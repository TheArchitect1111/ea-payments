import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { resolveTb3Cart } from '@/lib/tb3/merch-cart';
import { PrintfulError, tb3Printful } from '@/lib/tb3/printful-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PrintfulOrder = {
  id: number;
  external_id?: string;
  status: string;
  costs?: {currency?: string; total?: string | number | null};
};

function externalId(sessionId: string) {
  // Printful external IDs have a 32-character limit and are unique per store.
  return 'tb3_' + createHash('sha256').update(sessionId).digest('hex').slice(0, 27);
}

async function lookup(id: string) {
  try {
    return await tb3Printful<PrintfulOrder>('/orders/@' + id);
  } catch (error) {
    if (error instanceof PrintfulError && error.status === 404) return null;
    throw error;
  }
}

// Stripe retries failed webhooks. Printful's store-unique external ID
// is the durable order identity; never use update_existing=true.
async function fulfill(session: Stripe.Checkout.Session) {
  if (session.metadata?.type !== 'tb3_merch') return;
  if (session.mode !== 'payment' || session.payment_status !== 'paid' ||
      session.currency !== 'usd' || !session.amount_total ||
      !session.customer || session.metadata.fulfillment !== 'pending_verified_webhook')
    throw new Error('TB3 payment must be fully verified before fulfillment.');

  const rawLines = JSON.parse(session.metadata.variant_quantities || 'null') as unknown;
  if (!Array.isArray(rawLines) || !rawLines.every(x => Array.isArray(x) &&
      x.length === 2 && Number.isInteger(x[0]) && Number.isInteger(x[1])))
    throw new Error('TB3 order lines are invalid.');
  const lines = resolveTb3Cart(rawLines.map(x => ({
    variantId: x[0] as number, quantity: x[1] as number,
  })));
  const rawRecipient = JSON.parse(session.metadata.destination || 'null') as Record<string, unknown>;
  if (!rawRecipient || rawRecipient.country_code !== 'US' ||
      typeof rawRecipient.name !== 'string' ||
      typeof rawRecipient.address1 !== 'string' ||
      typeof rawRecipient.city !== 'string' ||
      typeof rawRecipient.state_code !== 'string' ||
      typeof rawRecipient.zip !== 'string')
    throw new Error('TB3 address data unavailable.');

  const stripe = new Stripe(process.env.TB3_STRIPE_SECRET_KEY!);
  const customer = await stripe.customers.retrieve(session.customer as string);
  if (customer.deleted || !customer.email ||
      !customer.shipping?.address ||
      customer.shipping.address.line1 !== rawRecipient.address1 ||
      customer.shipping.address.postal_code !== rawRecipient.zip)
    throw new Error('TB3 Stripe shipping identity does not match order.');

  const id = externalId(session.id);
  let order = await lookup(id);
  if (!order) {
    try {
      order = await tb3Printful<PrintfulOrder>('/orders?confirm=false', {
        method: 'POST',
        body: JSON.stringify({
          external_id: id,
          shipping: session.metadata.printful_shipping || 'STANDARD',
          recipient: {...rawRecipient, email: customer.email},
          items: lines.map(line => ({
            sync_variant_id: line.variantId,
            quantity: line.quantity,
            retail_price: (line.unitAmount / 100).toFixed(2),
          })),
        }),
      });
    } catch (error) {
      // Another delivery may already have created this exact order.
      if (!(error instanceof PrintfulError) || error.status !== 409) throw error;
      order = await lookup(id);
      if (!order) throw error;
    }
  }
  if (order.external_id !== id)
    throw new Error('Printful order identity mismatch.');
  if (order.status !== 'draft') return; // already confirmed, never charge twice

  // Intentionally do not auto-confirm while Printful wallet ownership and
  // item costs have not been reconciled. Drafts do not incur fulfillment charges.
  console.info('[tb3-merch] verified paid order staged as Printful draft', {
    orderId: order.id, paymentSession: session.id,
  });
}

export async function POST(req: NextRequest) {
  if (process.env.TB3_MERCH_CHECKOUT_ENABLED !== 'true' ||
      process.env.TB3_MERCH_FULFILLMENT_LEDGER_READY !== 'true' ||
      !process.env.TB3_STRIPE_SECRET_KEY ||
      !process.env.TB3_STRIPE_WEBHOOK_SECRET)
    return NextResponse.json({error: 'TB3 payment handling unavailable.'}, {status: 503});

  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({error: 'Missing signature.'}, {status: 400});
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.TB3_STRIPE_SECRET_KEY);
    const raw = await req.text();
    if (raw.length > 2_000_000)
      return NextResponse.json({error: 'Payload too large.'}, {status: 413});
    event = stripe.webhooks.constructEvent(raw, signature,
      process.env.TB3_STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed' ||
        event.type === 'checkout.session.async_payment_succeeded') {
      const incoming = event.data.object as Stripe.Checkout.Session;
      if (incoming.metadata?.type === 'tb3_merch') {
        const current = await stripe.checkout.sessions.retrieve(incoming.id);
        await fulfill(current);
      }
    }
    return NextResponse.json({received: true});
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError)
      return NextResponse.json({error: 'Invalid signature.'}, {status: 400});
    console.error('[tb3-merch] webhook processing failed',
      error instanceof Error ? error.name : 'Unknown');
    return NextResponse.json({error: 'Fulfillment pending retry.'}, {status: 503});
  }
}
