import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { AMANDA_MEMBERSHIPS, AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

function depositEnvKey(offerId: string) {
  return `AMANDA_DEPOSIT_${offerId.replaceAll('-', '_').toUpperCase()}_CAD`;
}

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (!tenant.portalSlug.startsWith('amanda-catherine')) {
    return NextResponse.json({ error: 'Amanda portal access required.' }, { status: 403 });
  }
  return NextResponse.json({
    deposits: Object.fromEntries(AMANDA_OFFERS.map((offer) => [offer.id, Number(process.env[depositEnvKey(offer.id)] || 0)])),
    memberships: AMANDA_MEMBERSHIPS.map((membership) => ({
      id: membership.id,
      name: membership.name,
      available: Boolean(process.env[membership.stripePriceEnvKey]),
    })),
    financingUrl: process.env.AMANDA_FINANCING_URL || null,
  });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !auth.session.email) {
    return NextResponse.json({ error: 'Amanda portal access required.' }, { status: 403 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Secure payments are not configured yet.' }, { status: 503 });
  }
  const body = await req.json() as { offerId?: string; membershipId?: string; paymentOption?: 'full' | 'deposit' };
  const membership = AMANDA_MEMBERSHIPS.find((item) => item.id === body.membershipId);
  if (membership) {
    const priceId = process.env[membership.stripePriceEnvKey];
    if (!priceId) return NextResponse.json({ error: 'This membership is not available yet.' }, { status: 409 });
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      customer_email: auth.session.email,
      automatic_tax: { enabled: true },
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { portalSlug: tenant.portalSlug, amandaMembershipId: membership.id },
      subscription_data: { metadata: { portalSlug: tenant.portalSlug, amandaMembershipId: membership.id } },
      success_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?membership=active`,
      cancel_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  }
  const offer = AMANDA_OFFERS.find((item) => item.id === body.offerId);
  if (!offer) return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });

  let amountCad: number = offer.priceCad;
  if (body.paymentOption === 'deposit') {
    const configured = Number(process.env[depositEnvKey(offer.id)] || 0);
    if (!Number.isFinite(configured) || configured <= 0 || configured >= offer.priceCad) {
      return NextResponse.json({ error: 'The deposit amount has not been configured for this offer.' }, { status: 409 });
    }
    amountCad = configured;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    allow_promotion_codes: true,
    customer_email: auth.session.email,
    automatic_tax: { enabled: true },
    invoice_creation: { enabled: true },
    line_items: [{
      price_data: {
        currency: 'cad',
        unit_amount: Math.round(amountCad * 100),
        product_data: {
          name: `${offer.name}${body.paymentOption === 'deposit' ? ' — Deposit' : ''}`,
          description: body.paymentOption === 'deposit' ? `Deposit toward CAD $${offer.priceCad}` : undefined,
        },
      },
      quantity: 1,
    }],
    metadata: {
      portalSlug: tenant.portalSlug,
      amandaOfferId: offer.id,
      paymentOption: body.paymentOption === 'deposit' ? 'deposit' : 'full',
      fullPriceCad: String(offer.priceCad),
      amountPaidCad: String(amountCad),
    },
    success_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=success`,
    cancel_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=cancelled`,
  };
  const session = await getStripe().checkout.sessions.create(sessionParams);
  return NextResponse.json({ url: session.url });
}
