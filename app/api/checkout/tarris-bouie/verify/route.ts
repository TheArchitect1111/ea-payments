import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, paid: false, error: 'Stripe not configured' }, { status: 503 });
  }

  const sessionId = String(req.nextUrl.searchParams.get('session_id') || '');
  if (!sessionId.startsWith('cs_')) {
    return NextResponse.json({ ok: false, paid: false, error: 'Invalid session' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const meta = session.metadata || {};
    const offerOk = String(meta.commerceOfferId || meta.packageId || '') === 'tarris_bouie_deposit';
    const recordOk = String(meta.contractRecordId || '') === 'recd9zuiS7lDhBLAm';
    const amountOk = (session.amount_total || 0) === 50000 && String(session.currency || '').toLowerCase() === 'usd';
    const paid = session.payment_status === 'paid' && offerOk && recordOk && amountOk;
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '';

    return NextResponse.json({
      ok: true,
      paid,
      sessionId: session.id,
      paymentIntentId,
      amountTotal: session.amount_total || 0,
      currency: String(session.currency || '').toLowerCase(),
      offerId: String(meta.commerceOfferId || meta.packageId || ''),
      contractRecordId: String(meta.contractRecordId || ''),
      verifiedBy: 'stripe-server-api',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[tarris-payment] verification failed', error);
    return NextResponse.json({ ok: false, paid: false, error: 'Unable to verify Stripe session' }, { status: 400 });
  }
}
