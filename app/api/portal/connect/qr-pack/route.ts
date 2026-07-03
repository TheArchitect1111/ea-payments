import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized } from '@/lib/api/portal-route';
import { buildConnectKit } from '@/lib/connect-kit';
import { buildConnectQrPackZip, type QrPackFilter } from '@/lib/connect-qr-pack';
import { getConnectOrg } from '@/lib/connect-store';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function parseFilter(raw: string | null): QrPackFilter {
  if (raw === 'event' || raw === 'staff') return raw;
  return 'all';
}

export async function GET(req: NextRequest) {
  const auth = await guardPortalApiCookie({ realm: 'portal' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!roleAtLeast(normalizeRole(auth.session.role), 'staff')) {
    return NextResponse.json({ error: 'Owner or staff access required.' }, { status: 403 });
  }

  const filter = parseFilter(req.nextUrl.searchParams.get('filter'));
  const format = req.nextUrl.searchParams.get('format') === 'svg' ? 'svg' : 'png';

  try {
    const org = await getConnectOrg(auth.session.slug);
    const kit = buildConnectKit(org, auth.session.slug);
    const pack = await buildConnectQrPackZip(kit, { filter, format });

    return new NextResponse(new Uint8Array(pack.buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${pack.filename}"`,
        'Cache-Control': 'no-store',
        'X-QR-Count': String(pack.count),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not build QR pack.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
