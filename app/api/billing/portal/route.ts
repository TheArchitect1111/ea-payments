import { NextResponse } from 'next/server';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { getStripe } from '@/lib/stripe';import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { syntheticOrgId } from '@/lib/platform-store';

export const dynamic = 'force-dynamic';

/** Create a Stripe Customer Portal session for the logged-in portal org owner. */
export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 });
  }

  const session = await requirePortalSession();
  if (!session?.slug) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }
  const org = await findOrganizationByPortalSlug(session.slug);
  const orgId = org?.id ?? session.orgId ?? syntheticOrgId(session.slug);
  const stripeCustomerId = org?.stripeCustomerId;

  if (!stripeCustomerId) {
    return NextResponse.json(
      {
        error:
          'No billing account found for this organization. Subscribe to a plan first, or contact support.',
      },
      { status: 404 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const stripe = getStripe();

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/portal/${session.slug}/billing`,
    });

    return NextResponse.json({ url: portalSession.url, organizationId: orgId });
  } catch (err) {
    console.error('Billing portal session error:', err);
    return NextResponse.json({ error: 'Could not open billing portal.' }, { status: 500 });
  }
}
