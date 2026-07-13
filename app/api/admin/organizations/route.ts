import { NextRequest, NextResponse } from 'next/server';
import {
  adminAuthJsonError,
  requireAdminSessionFromRequest,
} from '@/lib/admin-session-guard';
import { listOrganizations, type OrganizationStatus } from '@/lib/organizations';
import { platformStoreConfigured } from '@/lib/platform-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) return adminAuthJsonError(auth);

  const statusParam = req.nextUrl.searchParams.get('status')?.trim() || 'Active';
  const status =
    statusParam === 'All' || statusParam === 'Active' || statusParam === 'Suspended'
      ? (statusParam as OrganizationStatus | 'All')
      : 'Active';

  const organizations = await listOrganizations({ status, maxRecords: 100 });

  return NextResponse.json({
    storeConfigured: platformStoreConfigured(),
    status,
    count: organizations.length,
    organizations: organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      portalSlug: org.portalSlug ?? null,
      status: org.status,
      platformClientId: org.platformClientId ?? null,
      themeId: org.themeId ?? null,
      personalityId: org.personalityId ?? null,
      workspaceName: org.workspaceName ?? null,
    })),
  });
}
