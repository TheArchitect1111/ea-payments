import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  getPurchasableSubscriptionPlans,
  getSubscriptionPlan,
  isSubscriptionPlanPurchasable,
} from '@/lib/subscription-catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  const plans = getPurchasableSubscriptionPlans().map((plan) => ({
    id: plan.id,
    displayName: plan.displayName,
    description: plan.description,
    interval: plan.interval,
    priceCents: plan.priceCents,
    trialDays: plan.trialDays ?? 0,
  }));
  return NextResponse.json({ plans });
}

interface SubscriptionCheckoutBody {
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  planId?: string;
  referralSource?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubscriptionCheckoutBody;
    const { name, organization, email, phone, planId, referralSource } = body;

    if (!name?.trim() || !email?.trim() || !planId?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and plan selection are required.' },
        { status: 400 },
      );
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 },
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing is not yet configured. Please contact us directly.' },
        { status: 503 },
      );
    }

    const plan = getSubscriptionPlan(planId.trim());
    if (!plan || !isSubscriptionPlanPurchasable(plan)) {
      return NextResponse.json(
        { error: 'Invalid or unavailable subscription plan.' },
        { status: 400 },
      );
    }

    const stripePriceId = process.env[plan.stripePriceEnvKey];
    if (!stripePriceId && !plan.allowInlineStripePrice) {
      return NextResponse.json(
        {
          error:
            'This plan is not yet available for online purchase. Please contact us to arrange billing.',
        },
        { status: 503 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const stripe = getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [
        stripePriceId
          ? { price: stripePriceId, quantity: 1 }
          : {
              price_data: {
                currency: 'usd',
                unit_amount: plan.priceCents,
                recurring: { interval: plan.interval },
                product_data: {
                  name: plan.displayName,
                  description: plan.description,
                },
              },
              quantity: 1,
            },
      ],
      customer_email: email.trim(),
      subscription_data: {
        ...(plan.trialDays && plan.trialDays > 0
          ? { trial_period_days: plan.trialDays }
          : {}),
        metadata: {
          planId: plan.id,
          packageName: plan.airtablePackageName,
          clientEmail: email.trim().toLowerCase(),
          clientName: name.trim(),
          organization: organization?.trim() ?? '',
        },
      },
      metadata: {
        checkoutType: 'subscription',
        planId: plan.id,
        packageName: plan.airtablePackageName,
        clientName: name.trim(),
        organization: organization?.trim() ?? '',
        phone: phone?.trim() ?? '',
        referralSource: referralSource?.trim() ?? '',
        clientEmail: email.trim().toLowerCase(),
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Subscription checkout error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Checkout failed: ${msg}` }, { status: 500 });
  }
}
