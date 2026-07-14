import { NextRequest, NextResponse } from 'next/server';
import { makeSessionCookie, signSession } from '@/lib/ea-portal-auth';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';
import { findMembership } from '@/lib/memberships';
import { getOrganizationById } from '@/lib/organizations';

export const dynamic = 'force-dynamic';

/** Switch the active organization for the current portal session. */
export async function POST(req: NextRequest) {
  const session = await requirePortalSessionFromRequest(req);
  if (!session?.email) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  let body: { organizationId?: string };
  try {
    body = (await req.json()) as { organizationId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const organizationId = (body.organizationId ?? '').trim();
  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId is required.' }, { status: 400 });
  }

  const membership = await findMembership(session.email, organizationId);
  if (!membership || membership.status !== 'active') {
    return NextResponse.json({ error: 'You are not a member of that organization.' }, { status: 403 });
  }
  const role = membership.role;

  const org = await getOrganizationById(organizationId);
  const portalSlug = org?.portalSlug ?? session.slug;

  const newToken = await signSession({
    slug: portalSlug,
    orgId: organizationId,
    role,
    email: session.email,
  });

  if (!newToken) {
    return NextResponse.json({ error: 'Session signing failed.' }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    organizationId,
    role,
    portalSlug,
    next: `/portal/${portalSlug}`,
  });
  res.cookies.set(makeSessionCookie(newToken));
  return res;
}
