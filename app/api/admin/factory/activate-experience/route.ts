import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { getExperienceLaunchPreset } from '@/lib/experience-launch-presets';
import { provisionWebsitePortalSite } from '@/lib/provision-website-portal';
import { publicPortalLoginUrl, publicPortalUrl } from '@/lib/ctp-portal-host';
import { isSiteQuarantined } from '@/lib/site-quarantine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** One-action activation through the existing Director-gated Website + Portal provisioner. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { presetId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const preset = getExperienceLaunchPreset(String(body.presetId || '').trim());
  if (!preset) {
    return NextResponse.json({ error: 'Experience preset not found.' }, { status: 404 });
  }

  if (isSiteQuarantined(preset.provision.portalSlug)) {
    return NextResponse.json(
      { error: 'This experience is quarantined and cannot be published.' },
      { status: 409 },
    );
  }

  const result = await provisionWebsitePortalSite(preset.provision);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error || 'Experience activation failed.',
        directorGate: result.directorGate,
        directorReview: result.directorReview,
      },
      { status: result.directorGate && !result.directorGate.ok ? 403 : 500 },
    );
  }

  const origin = new URL(req.url).origin;
  const slug = preset.provision.portalSlug;
  return NextResponse.json({
    ok: true,
    presetId: preset.id,
    pageId: result.pageId,
    websiteUrl: result.siteUrl,
    portalUrl: publicPortalUrl(slug),
    portalLoginUrl: publicPortalLoginUrl(slug),
    adminUrl: `${origin}/admin/capability-marketplace`,
    directorReview: result.directorReview,
  });
}
