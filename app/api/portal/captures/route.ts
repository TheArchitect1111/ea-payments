import { NextResponse } from 'next/server';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { getPortalCaptures } from '@/lib/capture-records';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await requirePortalSession({ realm: 'simplifi' });
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
