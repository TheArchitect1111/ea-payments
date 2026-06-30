import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { makeSessionCookie, signSession, EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { findMembership } from '@/lib/memberships';
import { getOrganizationById } from '@/lib/organizations';

export const dynamic = 'force-dynamic';

/** Switch the active organization for the current portal session. */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

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
  const role = membership?.role ?? (organizationId === session.orgId ? session.role : undefined);

  if (!role) {
    return NextResponse.json({ error: 'You are not a member of that organization.' }, { status: 403 });
  }

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
