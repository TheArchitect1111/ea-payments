import { NextResponse } from 'next/server';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { listMembershipsForUser } from '@/lib/memberships';
import { getOrganizationById } from '@/lib/organizations';

export const dynamic = 'force-dynamic';

/** List organizations the current portal user belongs to. */
export async function GET() {
  const session = await requirePortalSession();
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


  return NextResponse.json({
    currentOrgId: session.orgId ?? null,
    currentRole: session.role ?? null,
    organizations,
  });
}
