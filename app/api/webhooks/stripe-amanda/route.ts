import { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  fulfillAmandaCheckout,
  isAmandaCheckoutSession,
  updateAmandaMembershipLifecycle,
} from '@/lib/amanda-catherine/payment-fulfillment';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  const secret = process.env.STRIPE_AMANDA_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return new Response('Amanda Stripe webhook not configured.', { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signature verification failed';
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (isAmandaCheckoutSession(session)) {
      const result = await fulfillAmandaCheckout(session, 'webhook');
      if (!result.ok) {
        console.error('[amanda-payment] webhook fulfillment failed', result.error);
        return new Response(result.error, { status: 409 });
      }
    }
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    await updateAmandaMembershipLifecycle(event.data.object as Stripe.Subscription);
  }

  return Response.json({ received: true });
}
