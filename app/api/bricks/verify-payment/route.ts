import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * BRICKS Billing reuses the platform Stripe adapter.
 * No caller-provided "paid" flag is trusted. Neither browser cookies nor CORS convey authority.
 */
export async function POST(req: NextRequest) {
  const serviceToken = process.env.EA_BRICKS_BILLING_SERVICE_TOKEN?.trim() || '';
  const bearer = /^Bearer ([^\s]+)$/i.exec(req.headers.get('authorization') || '')?.[1] || '';
  if (serviceToken.length < 24 || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, paid: false, error: 'Billing verification unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!constantTimeEqual(bearer, serviceToken)) {
    return NextResponse.json({ ok: false, paid: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const text = await req.text();
    if (text.length > 2048) return NextResponse.json({ ok: false, paid: false }, { status: 413 });
    const data = JSON.parse(text) as Record<string, unknown>;
    const { tenantId, sessionId, amountTotal, currency, offerId } = data;
    if (
      typeof tenantId !== 'string' || !/^[a-z0-9][a-z0-9-]{1,80}$/.test(tenantId) ||
      typeof sessionId !== 'string' || !/^cs_(test_|live_)[A-Za-z0-9]+$/.test(sessionId) ||
      typeof offerId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(offerId) ||
      typeof amountTotal !== 'number' || !Number.isSafeInteger(amountTotal) || amountTotal < 0 ||
      typeof currency !== 'string' || !/^[A-Za-z]{3}$/.test(currency)
    ) return NextResponse.json({ ok: false, paid: false }, { status: 400 });
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata || {};
    const verified = session.id === sessionId &&
      session.payment_status === 'paid' &&
      session.amount_total === amountTotal &&
      session.currency?.toUpperCase() === currency.toUpperCase() &&
      metadata.tenantId === tenantId &&
      metadata.offerId === offerId;
    if (!verified) {
      return NextResponse.json({ ok: false, paid: false, error: 'Payment not verified for this tenant and offer' },
        { status: 402, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({
      ok: true, paid: true, verifiedBy: 'stripe-server-api', tenantId, sessionId,
      amountTotal: session.amount_total, currency: session.currency?.toUpperCase(), offerId,
    }, { headers: { 'Cache-Control': 'no-store, private' } });
  } catch {
    return NextResponse.json({ ok: false, paid: false, error: 'Payment verification failed' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
