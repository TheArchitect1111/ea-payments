import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { buildConnectKit } from '@/lib/connect-kit';
import { buildConnectPrintPackHtml, type QrPackFilter } from '@/lib/connect-qr-pack';
import { getConnectOrg } from '@/lib/connect-store';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

function parseFilter(raw: string | null): QrPackFilter {
  if (raw === 'event' || raw === 'staff') return raw;
  return 'all';
}

/** Printable HTML sheet — use browser Print → Save as PDF. */
export async function GET(req: NextRequest) {
  const auth = await guardPortalApiCookie({ realm: 'portal' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (!roleAtLeast(normalizeRole(auth.session.role), 'staff')) {
    return NextResponse.json({ error: 'Owner or staff access required.' }, { status: 403 });
  }

  const filter = parseFilter(req.nextUrl.searchParams.get('filter'));

  try {
    const org = await getConnectOrg(tenant.portalSlug);
    const kit = buildConnectKit(org, tenant.portalSlug);
    const html = buildConnectPrintPackHtml(kit, filter);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not build print pack.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
