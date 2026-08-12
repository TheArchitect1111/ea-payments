import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getStripe } from '@/lib/stripe';
import { fulfillAmandaCheckout } from '@/lib/amanda-catherine/payment-fulfillment';

export const dynamic = 'force-dynamic';

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

  const body = await req.json() as { sessionId?: string };
  const sessionId = body.sessionId?.trim();
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Valid checkout session required.' }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'payment_intent'],
    });
    const meta = session.metadata ?? {};
    if (
      meta.portalSlug !== tenant.portalSlug ||
      String(meta.clientEmail || '').toLowerCase() !== auth.session.email.toLowerCase()
    ) {
      return NextResponse.json({ error: 'This payment does not belong to this portal session.' }, { status: 403 });
    }
    const result = await fulfillAmandaCheckout(session, 'return-verification');
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ ok: true, payment: result.record });
  } catch (error) {
    console.error('[amanda-payment] return verification failed', error);
    return NextResponse.json({ error: 'Stripe payment could not be verified.' }, { status: 502 });
  }
}
