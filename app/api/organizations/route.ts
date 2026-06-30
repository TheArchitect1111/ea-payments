import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { listMembershipsForUser } from '@/lib/memberships';
import { getOrganizationById } from '@/lib/organizations';

export const dynamic = 'force-dynamic';

/** List organizations the current portal user belongs to. */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session?.email) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const memberships = await listMembershipsForUser(session.email);
  const organizations = await Promise.all(
    memberships.map(async (m) => {
      const org = await getOrganizationById(m.organizationId);
      return {
        organizationId: m.organizationId,
        role: m.role,
        name: org?.name ?? m.organizationId,
        slug: org?.slug ?? session.slug,
        portalSlug: org?.portalSlug ?? session.slug,
        isCurrent: m.organizationId === session.orgId,
      };
    }),
  );

  if (organizations.length === 0 && session.orgId) {
    organizations.push({
      organizationId: session.orgId,
      role: session.role ?? 'owner',
      name: session.slug,
      slug: session.slug,
      portalSlug: session.slug,
      isCurrent: true,
    });
  }

  return NextResponse.json({
    currentOrgId: session.orgId ?? null,
    currentRole: session.role ?? null,
    organizations,
  });
}
