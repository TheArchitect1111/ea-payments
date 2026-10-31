import { amandaKitCheckout, type AmandaKitSelection } from '@/lib/amanda-catherine/kit-fulfillment';
import { AMANDA_SUPPORT_WORDING, amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import { getAmandaHqTools } from '@/lib/amanda-catherine/hq-tools';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { AMANDA_MEMBERSHIPS, AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { getStripe } from '@/lib/stripe';
import { listAmandaPayments } from '@/lib/amanda-catherine/payment-fulfillment';
import { roleAtLeast, normalizeRole } from '@/lib/rbac';
import { getClientByEmail, getClientByPortalSlug } from '@/lib/airtable';
import { isAmandaOwnerEmail } from '@/lib/amanda-catherine/client-access';
import { registerAmandaCheckout } from '@/lib/amanda-catherine/payments';

export const dynamic = 'force-dynamic';

function depositEnvKey(offerId: string) { return `AMANDA_DEPOSIT_${offerId.replaceAll('-', '_').toUpperCase()}_CAD`; }
async function canUseTestCheckout(role: string | undefined, portalSlug: string, sessionEmail: string) {
  if (portalSlug === 'amanda-catherine' && isAmandaOwnerEmail(sessionEmail)) return true;
  if (roleAtLeast(normalizeRole(role), 'admin')) return true;
  const client = await getClientByPortalSlug(portalSlug);
  const ownerEmail = String(client?.email || '').trim().toLowerCase();
  return Boolean(ownerEmail && ownerEmail === sessionEmail.trim().toLowerCase());
}

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (tenant.portalSlug !== 'amanda-catherine' || !auth.session.email) return NextResponse.json({ error: 'Amanda portal access required.' }, { status: 403 });
  const [allowedByRole, hqTools] = await Promise.all([
    canUseTestCheckout(auth.session.role, tenant.portalSlug, auth.session.email),
    getAmandaHqTools(),
  ]);
  return NextResponse.json({
    deposits: Object.fromEntries(AMANDA_OFFERS.map((offer) => [offer.id, Number(process.env[depositEnvKey(offer.id)] || 0)])),
    memberships: AMANDA_MEMBERSHIPS.map((membership) => ({ id: membership.id, name: membership.name, available: Boolean(process.env[membership.stripePriceEnvKey]) })),
    testCheckoutAllowed: allowedByRole && hqTools.testPayment === true,
    financingUrl: process.env.AMANDA_FINANCING_URL || null,
    payments: await listAmandaPayments(tenant.portalSlug, auth.session.email),
  });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (tenant.portalSlug !== 'amanda-catherine' || !auth.session.email) return NextResponse.json({ error: 'Amanda portal access required.' }, { status: 403 });
  const body = await req.json() as { offerId?: string; membershipId?: string; paymentOption?: 'full' | 'deposit' | 'test'; testName?: string } & AmandaKitSelection;
  const membership = AMANDA_MEMBERSHIPS.find((item) => item.id === body.membershipId);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const clientEmail = auth.session.email.trim().toLowerCase();

  if (membership) {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Secure payments are not configured yet.' }, { status: 503 });
    const priceId = process.env[membership.stripePriceEnvKey];
    if (!priceId) return NextResponse.json({ error: 'This membership is not available yet.' }, { status: 409 });
    const registrationId = crypto.randomUUID();
    const metadata = { portalSlug: tenant.portalSlug, amandaMembershipId: membership.id, clientEmail, registrationId };
    try { await registerAmandaCheckout({registrationId,brickId:membership.id,name:clientEmail,email:clientEmail,source:'/portal/amanda-catherine/billing',isTest:process.env.VERCEL_ENV==='preview'}); } catch {return NextResponse.json({error:'Signup tracking is unavailable.'},{status:503});}
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription', payment_method_types: ['card'], allow_promotion_codes: true, customer_email: clientEmail,
      line_items: [{ price: priceId, quantity: 1 }], metadata, subscription_data: { metadata },
      success_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?membership=active&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  }

  const offer = AMANDA_OFFERS.find((item) => item.id === body.offerId);
  if (!offer) return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });
  if ('courseId' in offer && !amandaCourseReady(offer.courseId)) return NextResponse.json({ error: 'This course is waitlist only.' }, { status: 409 });
  const isTest = body.paymentOption === 'test';
  if (offer.id.startsWith('test-') && !isTest) return NextResponse.json({ error: 'Test offers require the private test checkout flow.' }, { status: 409 });
  if (isTest && !offer.id.startsWith('test-')) return NextResponse.json({ error: 'Private $1 test checkout is available only for test- offers.' }, { status: 409 });
  if (isTest && (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_'))) {
    throw new Error('Test checkout blocked: STRIPE_SECRET_KEY is not a test key. Will not use live key.');
  }
  if (!isTest && !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Secure payments are not configured yet.' }, { status: 503 });
  const testName = String(body.testName || '').trim().slice(0, 120);
  if (isTest && testName.length < 2) return NextResponse.json({error:'Enter a name for the private $1 signup test.'},{status:400});
  const registrationId = crypto.randomUUID();
  if (isTest && !('courseId' in offer)) return NextResponse.json({ error: 'Private test checkout is for READY test courses only.' }, { status: 409 });
  if (isTest && !(await getAmandaHqTools()).testPayment) return NextResponse.json({ error: 'The private $1 test is disabled in HQ.' }, { status: 403 });
  if (isTest && !(await canUseTestCheckout(auth.session.role, tenant.portalSlug, clientEmail))) return NextResponse.json({ error: 'Private test checkout is restricted to Amanda administrators.' }, { status: 403 });
  // A private owner test must never create a real Client Records entry.
  // Its Stripe client must be explicitly in test mode before signup tracking or session creation.
  if (isTest) {
    const existingOwner = await getClientByEmail(clientEmail);
    if (!isAmandaOwnerEmail(clientEmail) && (!existingOwner || existingOwner.portalSlug !== tenant.portalSlug)) {
      return NextResponse.json({ error: 'Owner portal identity must already exist before a private test charge.' }, { status: 409 });
    }
  }

  let amountCad: number = isTest ? 1 : offer.priceCad;
  if (body.paymentOption === 'deposit') {
    const configured = Number(process.env[depositEnvKey(offer.id)] || 0);
    if (!Number.isFinite(configured) || configured <= 0 || configured >= offer.priceCad) return NextResponse.json({ error: 'The deposit amount has not been configured for this offer.' }, { status: 409 });
    amountCad = configured;
  }

  let kit = { metadata: {} as Record<string, string>, shippingOptions: [] as Stripe.Checkout.SessionCreateParams.ShippingOption[] };
  if ('courseId' in offer) {
    try { kit = await amandaKitCheckout(body); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Kit selection is invalid.' }, { status: 409 }); }
  }
  const paymentLabel = isTest ? ' — PRIVATE $1 TEST' : body.paymentOption === 'deposit' ? ' — Deposit' : '';
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment', shipping_options: kit.shippingOptions, payment_method_types: ['card'], allow_promotion_codes: !isTest,
    customer_email: clientEmail, invoice_creation: { enabled: true },
    line_items: [{ price_data: { currency: 'cad', unit_amount: Math.round(amountCad * 100), product_data: {
      name: `${offer.name}${paymentLabel}`,
      description: isTest ? `Private Amanda Catherine workflow test: access expires after 72 hours with no automatic rebill. Normal price CAD ${offer.priceCad}.`
        : body.paymentOption === 'deposit' ? `Deposit toward CAD $${offer.priceCad}`
          : 'courseId' in offer ? `Practitioner kit included in tuition. ${AMANDA_SUPPORT_WORDING}` : undefined,
    } }, quantity: 1 }],
    metadata: { ...kit.metadata, portalSlug: tenant.portalSlug, amandaOfferId: offer.id, clientEmail,
      paymentOption: isTest ? 'test' : body.paymentOption === 'deposit' ? 'deposit' : 'full',
      fullPriceCad: String(offer.priceCad), amountPaidCad: String(amountCad), privateTestCheckout: isTest ? 'true' : 'false',
      registrationId, clientName: isTest ? testName : clientEmail },
    success_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/portal/${tenant.portalSlug}/billing?payment=cancelled`,
  };
  try {
    await registerAmandaCheckout({registrationId,brickId:'courseId' in offer?offer.courseId:offer.id,
      name:isTest?testName:clientEmail,email:clientEmail,source:'/portal/amanda-catherine/billing',isTest:isTest||process.env.VERCEL_ENV==='preview'});
  } catch(error) {
    console.error('[amanda-checkout] signup tracking failed',error);
    return NextResponse.json({error:'Signup tracking is unavailable. No checkout was started.'},{status:503});
  }
  const session = await getStripe().checkout.sessions.create(sessionParams);
  return NextResponse.json({ url: session.url, registrationId: isTest ? registrationId : undefined });
}
