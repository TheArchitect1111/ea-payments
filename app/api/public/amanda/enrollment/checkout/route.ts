import { amandaKitCheckout, type AmandaKitSelection } from '@/lib/amanda-catherine/kit-fulfillment';
import { AMANDA_SUPPORT_WORDING, amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { getStripe } from '@/lib/stripe';
import { registerAmandaCheckout } from '@/lib/amanda-catherine/payments';

export const dynamic = 'force-dynamic';

// SINGLE $1 TEST LINK FOR BOTH - AMANDA + YOU
// Use fake card: 4242 4242 4242 4242

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (tenant.portalSlug !== 'amanda-catherine' || !auth.session.email) {
    return NextResponse.json({ error: 'Amanda portal access required.' }, { status: 403 });
  }
  return NextResponse.json({
    testCheckoutAllowed: true, // ALWAYS ALLOW - 1 LINK
    singleTestLink: true,
    amount: 1,
    testCard: '4242 4242 4242 4242',
    deposits: {},
    memberships: [],
    financingUrl: null,
    payments: [],
  });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (tenant.portalSlug !== 'amanda-catherine' || !auth.session.email) {
    return NextResponse.json({ error: 'Amanda portal access required.' }, { status: 403 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Secure payments are not configured yet.' }, { status: 503 });
  }

  const body = await req.json() as { offerId?: string; testName?: string } & AmandaKitSelection;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const clientEmail = auth.session.email.trim().toLowerCase();
  const testName = String(body.testName || clientEmail).trim().slice(0, 120);

  // FORCE 1 LINK LOGIC - ALWAYS $1 TEST
  const offer = AMANDA_OFFERS.find((item) => item.id === body.offerId) || AMANDA_OFFERS[0];
  if (!offer) return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });
  if ('courseId' in offer && !amandaCourseReady(offer.courseId)) {
    // Allow test even if waitlist for testing purposes
  }

  const registrationId = crypto.randomUUID();
  const amountCad = 1; // SINGLE $1 LINK

  let kit = { metadata: {} as Record<string, string>, shippingOptions: [] as Stripe.Checkout.SessionCreateParams.ShippingOption[] };
  if ('courseId' in offer) {
    try { kit = await amandaKitCheckout(body); } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Kit selection is invalid.' }, { status: 409 });
    }
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    shipping_options: kit.shippingOptions,
    payment_method_types: ['card'],
    allow_promotion_codes: false,
    customer_email: clientEmail,
    invoice_creation: { enabled: true },
    line_items: [{
      price_data: {
        currency: 'cad',
        unit_amount: 100, // $1
        product_data: {
          name: `${offer.name} — $1 TEST (Reusable)`,
          description: `Single $1 test link for Amanda + Brick. Email + subportal access test. Normal price CAD ${offer.priceCad}. Expires 72h, no rebill. Use test card 4242...`,
        },
      },
      quantity: 1,
    }],
    metadata: {
      ...kit.metadata,
      portalSlug: tenant.portalSlug,
      amandaOfferId: offer.id,
      clientEmail,
      paymentOption: 'test',
      fullPriceCad: String(offer.priceCad),
      amountPaidCad: '1',
      privateTestCheckout: 'true',
      singleTestLink: 'true',
      reusable: 'true',
      registrationId,
      clientName: testName,
    },
    success_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=success&session_id={CHECKOUT_SESSION_ID}&test=1`,
    cancel_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=cancelled`,
  };

  try {
    await registerAmandaCheckout({
      registrationId,
      brickId: 'courseId' in offer ? offer.courseId : offer.id,
      name: testName,
      email: clientEmail,
      source: '/portal/amanda-catherine/billing - SINGLE $1 LINK TEST',
      isTest: true,
    });
  } catch (error) {
    console.error('[amanda-checkout] signup tracking failed', error);
    return NextResponse.json({ error: 'Signup tracking is unavailable.' }, { status: 503 });
  }

  const session = await getStripe().checkout.sessions.create(sessionParams);
  return NextResponse.json({ url: session.url, registrationId });
}
