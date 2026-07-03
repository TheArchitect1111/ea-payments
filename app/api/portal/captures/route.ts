import { NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getPortalCaptures } from '@/lib/capture-records';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const session = auth.session;

  const captures = await getPortalCaptures(tenant.portalSlug, 25);
  return NextResponse.json({
    ok: true,
    captures: captures.map((c) => ({
      id: c.captureId || c.id,
      recordId: c.id,
      title: c.title,
      businessName: c.businessName,
      shareUrl: c.shareUrl,
      considerSlug: c.considerSlug,
      dateCaptured: c.dateCaptured,
      magnifiUrl: c.considerSlug ? `/consider/${c.considerSlug}` : c.shareUrl,
    })),
  });
}
