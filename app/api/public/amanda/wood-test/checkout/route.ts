import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireTestKey, woodTestOrigin, WOOD_TEST_FLOW, WOOD_TEST_COURSE } from '@/lib/amanda-catherine/reusable-test';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(requireTestKey());
    const origin = woodTestOrigin(req.nextUrl.origin);
    const metadata = { portalSlug: 'amanda-catherine', amandaOfferId: WOOD_TEST_COURSE,
      amandaCourseId: WOOD_TEST_COURSE, enrollmentFlow: WOOD_TEST_FLOW,
      paymentOption: 'test', privateTestCheckout: 'true', kitFulfillment: 'pickup', kitShippingCents: '0' };
    // Stripe collects each student's email. A fresh session is created per click.
    const session = await stripe.checkout.sessions.create({ mode: 'payment', payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'cad', unit_amount: 100,
        product_data: { name: 'Wood Therapy — $1 TEST', description: 'Test payment only. Course preview for 72 hours. No physical kit or automatic renewal.' } }, quantity: 1 }],
      metadata, payment_intent_data: { metadata },
      success_url: `${origin}/amanda-catherine/test-wood-therapy/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/amanda-catherine/test-wood-therapy?cancelled=1` });
    if (session.livemode !== false || !session.url || !session.id.startsWith('cs_test_')) throw new Error('Stripe TEST checkout could not be verified.');
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith('Test checkout blocked:')
      ? error.message : 'Test checkout could not be opened. Please try again.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
