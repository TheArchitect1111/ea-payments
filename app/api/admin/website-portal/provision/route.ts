import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { getClientByPortalSlug } from '@/lib/airtable';
import { provisionWebsitePortalSite } from '@/lib/provision-website-portal';

export const dynamic = 'force-dynamic';

/**
 * Admin dry-run / repair: provision or refresh a starter website for a portal slug.
 * POST { portalSlug, businessName?, organizationName?, tagline?, industry?, force? }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    portalSlug?: string;
    businessName?: string;
    organizationName?: string;
    tagline?: string;
    industry?: string;
    headline?: string;
    ctaLabel?: string;
    primaryColor?: string;
    accentColor?: string;
    themeId?: string;
    force?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const portalSlug = String(body.portalSlug || '')
    .trim()
    .toLowerCase();
  if (!portalSlug) {
    return NextResponse.json({ error: 'portalSlug is required.' }, { status: 400 });
  }

  const client = await getClientByPortalSlug(portalSlug);
  const businessName =
    body.businessName?.trim() ||
    client?.clientName ||
    client?.organization ||
    portalSlug;
  const organizationName =
    body.organizationName?.trim() || client?.organization || undefined;

  const result = await provisionWebsitePortalSite({
    portalSlug,
    businessName,
    organizationName,
    tagline: body.tagline?.trim() || undefined,
    industry: body.industry?.trim() || undefined,
    headline: body.headline?.trim() || undefined,
    ctaLabel: body.ctaLabel?.trim() || undefined,
    primaryColor: body.primaryColor?.trim() || undefined,
    accentColor: body.accentColor?.trim() || undefined,
    themeId: body.themeId?.trim() || undefined,
    email: client?.email,
    force: body.force === true,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Provision failed.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    portalSlug,
    pageId: result.pageId,
    siteUrl: result.siteUrl,
    previewPath: result.previewPath,
    forced: body.force === true,
  });
}
