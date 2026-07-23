import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { getExperienceLaunchPreset } from '@/lib/experience-launch-presets';
import { provisionWebsitePortalSite } from '@/lib/provision-website-portal';
import { publicPortalLoginUrl, publicPortalUrl } from '@/lib/ctp-portal-host';
import { isSiteQuarantined } from '@/lib/site-quarantine';
import { provisionExperiencePortalTenant } from '@/lib/experience-portal-provision';

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

  const email = preset.provision.email?.trim();
  if (!email) {
    return NextResponse.json({ error: 'The experience preset needs a portal email.' }, { status: 400 });
  }

  const portal = await provisionExperiencePortalTenant({
    clientName: preset.provision.businessName,
    organization: preset.provision.organizationName || preset.provision.businessName,
    email,
    themeId: preset.provision.themeId || 'ea-default-theme',
    workspaceName: `${preset.provision.businessName} Experience`,
    primaryColor: preset.provision.primaryColor || '#17130F',
    accentColor: preset.provision.accentColor || '#B9894D',
  });
  if (!portal.ok || !portal.portalSlug) {
    return NextResponse.json(
      { error: portal.error || 'Portal tenant activation failed.' },
      { status: 500 },
    );
  }

  const quarantined = isSiteQuarantined(preset.provision.portalSlug);
  const result = quarantined ? null : await provisionWebsitePortalSite(preset.provision);
  if (result && !result.ok) {
    return NextResponse.json(
      { error: result.error || 'Experience website activation failed.', directorGate: result.directorGate },
      { status: result.directorGate && !result.directorGate.ok ? 403 : 500 },
    );
  }

  const origin = new URL(req.url).origin;
  const slug = portal.portalSlug;
  return NextResponse.json({
    ok: true,
    presetId: preset.id,
    pageId: result?.pageId,
    websiteUrl: result?.siteUrl,
    websiteStatus: quarantined ? 'quarantined' : 'live',
    portalUrl: publicPortalUrl(slug, 'ctp'),
    portalLoginUrl: publicPortalLoginUrl(slug),
    adminUrl: `${origin}/admin/capability-marketplace`,
    tempCredentials: portal.tempCredentials,
    directorReview: result?.directorReview,
  });
}
