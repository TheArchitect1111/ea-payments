import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { AMANDA_MEMBERSHIPS, AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { getStripe } from '@/lib/stripe';
import { listAmandaPayments } from '@/lib/amanda-catherine/payment-fulfillment';
import { roleAtLeast, normalizeRole } from '@/lib/rbac';
import { getClientByPortalSlug } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

function depositEnvKey(offerId: string) {
  return `AMANDA_DEPOSIT_${offerId.replaceAll('-', '_').toUpperCase()}_CAD`;
}

async function canUseTestCheckout(role: string | undefined, portalSlug: string, sessionEmail: string) {
  if (roleAtLeast(normalizeRole(role), 'admin')) return true;
  const client = await getClientByPortalSlug(portalSlug);
  const ownerEmail = String(client?.email || '').trim().toLowerCase();
  return Boolean(ownerEmail && ownerEmail === sessionEmail.trim().toLowerCase());
}

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !auth.session.email) {
    return NextResponse.json({ error: 'Amanda portal access required.' }, { status: 403 });
  }
  return NextResponse.json({
    deposits: Object.fromEntries(AMANDA_OFFERS.map((offer) => [offer.id, Number(process.env[depositEnvKey(offer.id)] || 0)])),
    memberships: AMANDA_MEMBERSHIPS.map((membership) => ({
      id: membership.id,
      name: membership.name,
      available: Boolean(process.env[membership.stripePriceEnvKey]),
    })),
    testCheckoutAllowed: await canUseTestCheckout(auth.session.role, tenant.portalSlug, auth.session.email),
    financingUrl: process.env.AMANDA_FINANCING_URL || null,
    payments: await listAmandaPayments(tenant.portalSlug, auth.session.email),
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
  const body = await req.json() as { offerId?: string; membershipId?: string; paymentOption?: 'full' | 'deposit' | 'test' };
  const membership = AMANDA_MEMBERSHIPS.find((item) => item.id === body.membershipId);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const clientEmail = auth.session.email.trim().toLowerCase();

  if (membership) {
    const priceId = process.env[membership.stripePriceEnvKey];
    if (!priceId) return NextResponse.json({ error: 'This membership is not available yet.' }, { status: 409 });
    const metadata = {
      portalSlug: tenant.portalSlug,
      amandaMembershipId: membership.id,
      clientEmail,
    };
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      customer_email: clientEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: { metadata },
      success_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?membership=active&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  }

  const offer = AMANDA_OFFERS.find((item) => item.id === body.offerId);
  if (!offer) return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });

  const isTest = body.paymentOption === 'test';
  if (isTest && !(await canUseTestCheckout(auth.session.role, tenant.portalSlug, clientEmail))) {
    return NextResponse.json({ error: 'Private test checkout is restricted to Amanda administrators.' }, { status: 403 });
  }

  let amountCad: number = isTest ? 1 : offer.priceCad;
  if (body.paymentOption === 'deposit') {
    const configured = Number(process.env[depositEnvKey(offer.id)] || 0);
    if (!Number.isFinite(configured) || configured <= 0 || configured >= offer.priceCad) {
      return NextResponse.json({ error: 'The deposit amount has not been configured for this offer.' }, { status: 409 });
    }
    amountCad = configured;
  }

  const paymentLabel = isTest ? ' — PRIVATE $1 TEST' : body.paymentOption === 'deposit' ? ' — Deposit' : '';
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    allow_promotion_codes: !isTest,
    customer_email: clientEmail,
    invoice_creation: { enabled: true },
    line_items: [{
      price_data: {
        currency: 'cad',
        unit_amount: Math.round(amountCad * 100),
        product_data: {
          name: `${offer.name}${paymentLabel}`,
          description: isTest
            ? `Private Amanda Catherine workflow test. Normal price CAD $${offer.priceCad}.`
            : body.paymentOption === 'deposit'
              ? `Deposit toward CAD $${offer.priceCad}`
              : undefined,
        },
      },
      quantity: 1,
    }],
    metadata: {
      portalSlug: tenant.portalSlug,
      amandaOfferId: offer.id,
      clientEmail,
      paymentOption: isTest ? 'test' : body.paymentOption === 'deposit' ? 'deposit' : 'full',
      fullPriceCad: String(offer.priceCad),
      amountPaidCad: String(amountCad),
      privateTestCheckout: isTest ? 'true' : 'false',
    },
    success_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=cancelled`,
  };
  const session = await getStripe().checkout.sessions.create(sessionParams);
  return NextResponse.json({ url: session.url });
}
