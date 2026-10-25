import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { authorize, handled, json } from '@/lib/tb3/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handled(async () => {
    // Revenue is private business information, even to a signed-in viewer.
    await authorize(req, true);
    if (!process.env.TB3_STRIPE_SECRET_KEY)
      return json({error: 'TB3 payment reporting is not configured.'}, 503);
    const stripe = new Stripe(process.env.TB3_STRIPE_SECRET_KEY);
    const response = await stripe.checkout.sessions.list({limit: 100});
    const paid = response.data.filter(session =>
      session.metadata?.type === 'tb3_merch' &&
      session.mode === 'payment' && session.payment_status === 'paid' &&
      session.currency === 'usd' && typeof session.amount_total === 'number');
    return json({
      currency: 'USD',
      source: 'tb3-stripe',
      scope: 'most-recent-100-checkout-sessions',
      hasMore: response.has_more,
      grossCollectedCents: paid.reduce((sum, session) => sum + session.amount_total!, 0),
      verifiedPaidOrderCount: paid.length,
      note: 'Gross paid checkout amounts only. This is NOT net sales, income or profit: refunds, disputes, taxes, Stripe fees, Printful costs, and older pages are not reconciled.',
      orders: paid.map(session => ({
        reference: session.id,
        paidTotalCents: session.amount_total,
        created: session.created,
      })),
    });
  });
}
