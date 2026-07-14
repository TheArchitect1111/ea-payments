import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { buildPackageFulfillmentPlan, fulfillmentMetadata } from '@/lib/package-fulfillment';
import {
  buildCommerceCheckoutMetadata,
  isCheckoutOfferPurchasable,
  resolveCheckoutOffer,
} from '@/lib/platform/payments-bridge';

export const dynamic = 'force-dynamic';

interface CheckoutBody {
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  packageId?: string;
  referralSource?: string;
  tagline?: string;
  industry?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;
    const { name, organization, email, phone, packageId, referralSource, tagline, industry } = body;

    if (!name?.trim() || !email?.trim() || !packageId?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and package selection are required.' },
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

    const offer = resolveCheckoutOffer(packageId.trim());
    if (!offer || offer.kind !== 'one_time') {
      return NextResponse.json({ error: 'Invalid package selected.' }, { status: 400 });
    }

    if (!isCheckoutOfferPurchasable(offer) && !offer.allowInlineStripePrice) {
      return NextResponse.json(
        {
          error:
            'This package is not yet available for online purchase. Please contact us to arrange payment.',
        },
        { status: 503 },
      );
    }

    const stripePriceId = process.env[offer.stripePriceEnvKey];
    if (!stripePriceId && !offer.allowInlineStripePrice) {
      return NextResponse.json(
        {
          error:
            'This package is not yet available for online purchase. Please contact us to arrange payment.',
        },
        { status: 503 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const stripe = getStripe();
    const fulfillment = buildPackageFulfillmentPlan(offer);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [
        stripePriceId
          ? { price: stripePriceId, quantity: 1 }
          : {
              price_data: {
                currency: 'usd',
                unit_amount: offer.priceCents,
                product_data: {
                  name: offer.displayName,
                  description: offer.description,
                },
              },
              quantity: 1,
            },
      ],
      customer_email: email.trim(),
      metadata: {
        ...buildCommerceCheckoutMetadata(offer, {
          clientName: name.trim(),
          organization: organization?.trim() ?? '',
          phone: phone?.trim() ?? '',
          referralSource: referralSource?.trim() ?? '',
          tagline: tagline?.trim() ?? '',
          industry: industry?.trim() ?? '',
        }),
        ...fulfillmentMetadata(fulfillment),
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&package=${encodeURIComponent(offer.id)}&fulfillment=${encodeURIComponent(fulfillment.fulfillmentType)}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    };

    if (offer.priceCents > 50000) {
      sessionParams.custom_text = {
        after_submit: {
          message:
            'ACH bank transfer is recommended for this amount. It carries lower processing fees. Select "US Bank Account" if available at checkout.',
        },
      };
    }

    if (offer.priceCents > 250000) {
      sessionParams.invoice_creation = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Checkout failed: ${msg}` }, { status: 500 });
  }
}
