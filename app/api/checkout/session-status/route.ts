import { NextRequest, NextResponse } from 'next/server';
import { findPortalClientByEmail } from '@/lib/airtable';
import { getStripe } from '@/lib/stripe';
import { findPublishedSitePage, siteUrlForSlug } from '@/lib/provision-website-portal';

export const dynamic = 'force-dynamic';

/**
 * Post-checkout status for success page polling.
 * Resolves live site / portal URLs after webhook provision completes.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required.' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const meta = session.metadata ?? {};
    const packageId = String(meta.packageId || meta.commerceOfferId || '');
    const fulfillmentType = String(meta.fulfillmentType || '');
    const isWebsitePortalAuto =
      fulfillmentType === 'website-portal-auto' || packageId === 'website_portal_starter';

    const email = (
      session.customer_details?.email ||
      session.customer_email ||
      ''
    )
      .trim()
      .toLowerCase();

    const paid =
      session.payment_status === 'paid' ||
      session.status === 'complete' ||
      Boolean(session.payment_intent);

    let portalSlug: string | undefined;
    let portalLoginUrl: string | undefined;
    let siteUrl: string | undefined;

    if (email) {
      const client = await findPortalClientByEmail(email);
      if (client.ok && client.slug) {
        portalSlug = client.slug;
        const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://efficiencyarchitects.online').replace(
          /\/$/,
          '',
        );
        portalLoginUrl = `${base}/portal/login`;
        if (isWebsitePortalAuto) {
          const page = await findPublishedSitePage(portalSlug);
          if (page) siteUrl = siteUrlForSlug(portalSlug);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      paid,
      packageId,
      fulfillmentType,
      isWebsitePortalAuto,
      email: email || undefined,
      portalSlug,
      portalLoginUrl,
      siteUrl,
      ready: isWebsitePortalAuto ? Boolean(siteUrl && portalSlug) : paid,
    });
  } catch (err) {
    console.error('session-status error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not load session status.' },
      { status: 500 },
    );
  }
}
