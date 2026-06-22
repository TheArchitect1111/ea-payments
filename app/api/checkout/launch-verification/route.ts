import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getCatalogItem } from '@/lib/catalog';
import {
  LAUNCH_VERIFICATION_CANCEL_PATH,
  LAUNCH_VERIFICATION_PACKAGE_ID,
  LAUNCH_VERIFICATION_SUCCESS_PATH,
} from '@/lib/launch-verification';

export const dynamic = 'force-dynamic';

interface LaunchVerificationBody {
  name?: string;
  organization?: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LaunchVerificationBody;
    const { name, organization, email } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 },
      );
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing is not configured. Set STRIPE_SECRET_KEY on Vercel.' },
        { status: 503 },
      );
    }

    const item = getCatalogItem(LAUNCH_VERIFICATION_PACKAGE_ID);
    if (!item) {
      return NextResponse.json({ error: 'Launch Verification product not configured.' }, { status: 500 });
    }

    const stripePriceId = process.env[item.stripePriceEnvKey];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const stripe = getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        stripePriceId
          ? { price: stripePriceId, quantity: 1 }
          : {
              price_data: {
                currency: 'usd',
                unit_amount: item.priceCents,
                product_data: {
                  name: item.displayName,
                  description: item.description,
                },
              },
              quantity: 1,
            },
      ],
      customer_email: email.trim(),
      metadata: {
        flow: 'launch_verification',
        clientName: name.trim(),
        organization: organization?.trim() ?? '',
        packageId: item.id,
        packageName: item.airtablePackageName,
        email: email.trim(),
      },
      success_url: `${baseUrl}${LAUNCH_VERIFICATION_SUCCESS_PATH}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${LAUNCH_VERIFICATION_CANCEL_PATH}`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[launch-verification] checkout error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Checkout failed: ${msg}` }, { status: 500 });
  }
}

export async function GET() {
  const item = getCatalogItem(LAUNCH_VERIFICATION_PACKAGE_ID);
  const priceConfigured = Boolean(process.env.STRIPE_PRICE_LAUNCH_VERIFICATION);
  return NextResponse.json({
    product: item?.displayName ?? 'EA Launch Verification',
    priceUsd: 1,
    priceCents: 100,
    stripePriceConfigured: priceConfigured,
    checkoutPath: '/launch-verification',
  });
}
