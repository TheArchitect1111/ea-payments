import { NextRequest, NextResponse } from 'next/server';
import {
  adminAuthJsonError,
  requireAdminActionFromRequest,
  requireAdminSessionFromRequest,
} from '@/lib/admin-session-guard';
import {
  listClientFactoryPresets,
  reproduceClientFromPreset,
} from '@/lib/platform/client-factory';
import { platformStoreConfigured } from '@/lib/platform-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) return adminAuthJsonError(auth);

  return NextResponse.json({
    storeConfigured: platformStoreConfigured(),
    presets: listClientFactoryPresets(),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  let body: {
    name?: string;
    portalSlug?: string;
    platformClientId?: string;
    themeId?: string;
    personalityId?: string;
    workspaceName?: string;
    industry?: string;
    mission?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const result = await reproduceClientFromPreset({
    name: body.name ?? '',
    portalSlug: body.portalSlug ?? '',
    platformClientId: body.platformClientId ?? '',
    themeId: body.themeId,
    personalityId: body.personalityId,
    workspaceName: body.workspaceName,
    industry: body.industry,
    mission: body.mission,
  });

  if (!result.ok) {
    const status =
      result.code === 'store_unavailable'
        ? 503
        : result.code === 'slug_taken'
          ? 409
          : result.code === 'invalid_input' || result.code === 'unknown_preset'
            ? 400
            : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    organization: {
      id: result.organization.id,
      name: result.organization.name,
      slug: result.organization.slug,
      portalSlug: result.organization.portalSlug,
      platformClientId: result.organization.platformClientId,
      themeId: result.organization.themeId,
      personalityId: result.organization.personalityId,
      workspaceName: result.organization.workspaceName,
    },
    platformClientId: result.platformClientId,
    portalUrl: result.portalUrl,
    workspacePreviewUrl: result.workspacePreviewUrl,
    reproducePreviewUrl: result.reproducePreviewUrl,
    landingPreviewUrl: result.landingPreviewUrl,
    publicSiteUrl: result.publicSiteUrl,
    entitlements: result.entitlements,
    preset: result.preset,
  });
}
