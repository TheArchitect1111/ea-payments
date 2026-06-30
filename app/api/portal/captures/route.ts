import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getPortalCaptures } from '@/lib/capture-records';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const captures = await getPortalCaptures(session.slug, 25);

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
