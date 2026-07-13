import { NextRequest, NextResponse } from 'next/server';
import {
  adminAuthJsonError,
  requireAdminActionFromRequest,
  requireAdminSessionFromRequest,
} from '@/lib/admin-session-guard';
import {
  getOrganizationById,
  updateOrganizationWorkspaceConfig,
} from '@/lib/organizations';
import { getPlatformClientConfig } from '@/lib/platform/client-configs';
import {
  resolveWorkspaceConfigFromOrg,
  resolveWorkspaceShellForPortal,
} from '@/lib/platform/workspace-bridge';
import { platformStoreConfigured } from '@/lib/platform-store';
import { isSyntheticOrganizationId } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) return adminAuthJsonError(auth);

  const orgId = req.nextUrl.searchParams.get('organizationId')?.trim();
  if (!orgId) {
    return NextResponse.json({ error: 'organizationId is required.' }, { status: 400 });
  }

  if (isSyntheticOrganizationId(orgId)) {
    return NextResponse.json({
      organizationId: orgId,
      synthetic: true,
      organization: null,
      resolved: resolveWorkspaceConfigFromOrg(null, orgId.replace(/^org_/, ''), orgId),
      writable: false,
      storeConfigured: platformStoreConfigured(),
    });
  }

  const organization = await getOrganizationById(orgId);
  const slug = organization?.portalSlug || organization?.slug || '';
  const resolved = resolveWorkspaceConfigFromOrg(organization, slug, orgId);
  const shell = resolveWorkspaceShellForPortal({
    slug: slug || 'ea',
    orgId,
    enabledModuleIds: [],
    organization,
    ...resolved,
  });

  return NextResponse.json({
    organizationId: orgId,
    synthetic: false,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          portalSlug: organization.portalSlug,
          platformClientId: organization.platformClientId ?? null,
          themeId: organization.themeId ?? null,
          personalityId: organization.personalityId ?? null,
          workspaceName: organization.workspaceName ?? null,
          logo: organization.logo ?? null,
          brandColors: organization.brandColors ?? null,
        }
      : null,
    resolved,
    shell: {
      name: shell.name,
      workspaceName: shell.workspaceName,
      themeId: shell.theme.id,
      personalityId: shell.personality.id,
    },
    writable: Boolean(organization) && platformStoreConfigured(),
    storeConfigured: platformStoreConfigured(),
    airtableFields: [
      'Platform Client Id',
      'Theme Id',
      'Personality Id',
      'Workspace Name',
      'Logo',
      'Brand Colors',
    ],
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  const body = (await req.json().catch(() => null)) as {
    organizationId?: string;
    platformClientId?: string;
    themeId?: string;
    personalityId?: string;
    workspaceName?: string;
    logo?: string;
    brandColors?: string;
  } | null;

  const orgId = body?.organizationId?.trim();
  if (!orgId) {
    return NextResponse.json({ error: 'organizationId is required.' }, { status: 400 });
  }
  if (isSyntheticOrganizationId(orgId)) {
    return NextResponse.json(
      { error: 'Synthetic organizations cannot store Airtable workspace fields.' },
      { status: 400 },
    );
  }

  if (body?.platformClientId && !getPlatformClientConfig(body.platformClientId)) {
    return NextResponse.json(
      { error: `Unknown platformClientId: ${body.platformClientId}` },
      { status: 400 },
    );
  }

  const updated = await updateOrganizationWorkspaceConfig(orgId, {
    platformClientId: body?.platformClientId,
    themeId: body?.themeId,
    personalityId: body?.personalityId,
    workspaceName: body?.workspaceName,
    logo: body?.logo,
    brandColors: body?.brandColors,
  });

  if (!updated) {
    return NextResponse.json(
      { error: 'Organization not found or platform store not configured.' },
      { status: 404 },
    );
  }

  const resolved = resolveWorkspaceConfigFromOrg(
    updated,
    updated.portalSlug || updated.slug,
    updated.id,
  );

  return NextResponse.json({ ok: true, organization: updated, resolved });
}
