import { NextResponse } from 'next/server';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { findMembership } from '@/lib/memberships';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { can } from '@/lib/rbac';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 });
  }

  const session = await requirePortalSession();
  if (!session?.slug || !session.email || !session.orgId) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const organization = await findOrganizationByPortalSlug(session.slug);
  if (
    !organization ||
    organization.status !== 'Active' ||
    organization.id !== session.orgId
  ) {
    return NextResponse.json({ error: 'Billing organization could not be verified.' }, { status: 403 });
  }

  const membership = await findMembership(session.email, organization.id);
  if (
    !membership ||
    membership.status !== 'active' ||
    !can(membership.role, 'billing:manage')
  ) {
    return NextResponse.json({ error: 'Owner access is required to manage billing.' }, { status: 403 });
  }

  if (!organization.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No billing account found for this organization. Subscribe to a plan first, or contact support.' },
      { status: 404 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  try {
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: `${baseUrl}/portal/${session.slug}/billing`,
    });
    return NextResponse.json({ url: portalSession.url, organizationId: organization.id });
  } catch (err) {
    console.error('Billing portal session error:', err);
    return NextResponse.json({ error: 'Could not open billing portal.' }, { status: 500 });
  }
}
