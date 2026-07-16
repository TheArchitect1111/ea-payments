import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { buildMagnifiPrintPackHtml } from '@/lib/magnifi-print-pack';

export const dynamic = 'force-dynamic';

/** Printable Magnifi HTML — use browser Print → Save as PDF. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);

  const { id } = await params;
  const record = await getCaptureByIdentifier(id);
  if (!record) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  if (record.portalSlug && record.portalSlug !== tenant.portalSlug) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const html = buildMagnifiPrintPackHtml(record);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not build Magnifi print pack.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
