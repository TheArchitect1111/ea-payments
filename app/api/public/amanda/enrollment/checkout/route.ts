import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { AMANDA_SELF_ENROLLMENT_COURSES } from '@/lib/amanda-catherine/config';
import { getStripe } from '@/lib/stripe';
import { canonicalPlatformOrigin } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';

const recentRequests = new Map<string, number[]>();

function allowRequest(req: NextRequest) {
  const key = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const recent = (recentRequests.get(key) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 6) return false;
  recent.push(now);
  recentRequests.set(key, recent);
  return true;
}

export async function POST(req: NextRequest) {
  if (!allowRequest(req)) {
    return NextResponse.json({ error: 'Too many enrollment attempts. Please wait one minute.' }, { status: 429 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Secure enrollment payments are temporarily unavailable.' }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { offerId?: string; name?: string; email?: string };
  const offer = AMANDA_SELF_ENROLLMENT_COURSES.find((item) => item.offerId === String(body.offerId || ''));
  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 254);
  if (!offer || name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Choose a course and enter a valid name and email.' }, { status: 400 });
  }

  const origin = canonicalPlatformOrigin();
  const metadata = {
    portalSlug: 'amanda-catherine',
    amandaOfferId: offer.offerId,
    amandaCourseId: offer.courseId,
    clientEmail: email,
    clientName: name,
    enrollmentFlow: 'public-course-v1',
  };
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    allow_promotion_codes: true,
    customer_email: email,
    billing_address_collection: 'auto',
    invoice_creation: { enabled: true },
    line_items: [{
      price_data: {
        currency: 'cad',
        unit_amount: Math.round(offer.priceCad * 100),
        product_data: {
          name: offer.title,
          description: `Amanda Catherine course enrollment · ${offer.delivery.join(' or ')}`,
        },
      },
      quantity: 1,
    }],
    metadata,
    payment_intent_data: { metadata },
    success_url: `${origin}/portal/amanda-catherine/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/portal/amanda-catherine/enroll?payment=cancelled`,
  };

  try {
    const session = await getStripe().checkout.sessions.create(sessionParams);
    if (!session.url) throw new Error('Stripe did not return a checkout address.');
    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error('[amanda-enrollment] checkout creation failed', error);
    return NextResponse.json({ error: 'Secure checkout could not be opened. Please try again.' }, { status: 502 });
  }
}
