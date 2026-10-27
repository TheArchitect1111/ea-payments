import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { authorize, handled, json } from '@/lib/tb3/server';
import { stripeMerchantStore } from '@/lib/bricks/merchant-onboarding/stripe-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handled(async () => {
    // Revenue is private business information, even to a signed-in viewer.
    await authorize(req, true);
    if (!process.env.EA_STRIPE_CONNECT_SECRET_KEY || !process.env.EA_MERCHANT_DATABASE_URL)
      return json({error: 'TB3 payment reporting is not configured.'}, 503);
    const accountId = await stripeMerchantStore.get('tarris');
    if (!accountId) return json({error: 'TB3 merchant onboarding incomplete.'}, 503);
    const stripe = new Stripe(process.env.EA_STRIPE_CONNECT_SECRET_KEY);
    const response = await stripe.checkout.sessions.list({limit: 100}, {stripeAccount: accountId});
    const paid = response.data.filter(session =>
      session.metadata?.type === 'tb3_merch' && session.metadata?.tenant_id === 'tarris' &&
      session.mode === 'payment' && session.payment_status === 'paid' &&
      session.currency === 'usd' && typeof session.amount_total === 'number');
    // Bound provider calls so larger sales histories do not overwhelm Stripe.
    const paymentDetails: ({reference:string;stripeFeeCents:number;stripeNetCents:number;chargeStatus:string}|null)[] = [];
    for (let i = 0; i < paid.length; i += 5) {
      const batch = await Promise.all(paid.slice(i, i + 5).map(async session => {
        if (typeof session.payment_intent !== 'string') return null;
        const intent = await stripe.paymentIntents.retrieve(session.payment_intent,
          {expand: ['latest_charge.balance_transaction']}, {stripeAccount: accountId});
        const charge = intent.latest_charge;
        if (!charge || typeof charge === 'string' || charge.refunded ||
            (charge.amount_refunded ?? 0) > 0 || charge.disputed) return null;
        const balance = charge.balance_transaction;
        if (!balance || typeof balance === 'string' || balance.currency !== 'usd') return null;
        return {reference: session.id, stripeFeeCents: balance.fee,
          stripeNetCents: balance.net, chargeStatus: charge.status};
      }));
      paymentDetails.push(...batch);
    }
    const fullyReconciled = !response.has_more && paymentDetails.every(x => x !== null);
    return json({
      currency: 'USD',
      source: 'tb3-stripe',
      scope: 'most-recent-100-checkout-sessions',
      hasMore: response.has_more,
      grossCollectedCents: paid.reduce((sum, session) => sum + session.amount_total!, 0),
      verifiedPaidOrderCount: paid.length,
      attributedInstagramOrders: paid.filter(session => session.metadata?.attribution_source === 'instagram').length,
      attributedInstagramGrossCents: paid.filter(session => session.metadata?.attribution_source === 'instagram')
        .reduce((sum, session) => sum + session.amount_total!, 0),
      feeDetailsComplete: fullyReconciled,
      recentStripeFeeCents: paymentDetails.reduce((n, x) => n + (x?.stripeFeeCents ?? 0), 0),
      recentStripeNetCents: fullyReconciled ? paymentDetails.reduce((n,x) => n + x!.stripeNetCents, 0) : null,
      attributionNote: 'Instagram attribution is self-reported from campaign URLs; it is not independent Meta conversion verification.',
      note: 'Stripe net is not a cash balance or fulfillment profit. Payout timing, Printful charges, taxes, disputes, refunds, and older pages must be reconciled before reserve allocations or loan repayment.',
      orders: paid.map(session => ({
        reference: session.id,
        paidTotalCents: session.amount_total,
        created: session.created,
      })),
    });
  });
}
