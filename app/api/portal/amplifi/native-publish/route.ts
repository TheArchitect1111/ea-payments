import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { publishThroughGateway } from '@/lib/amplifi-publishing-gateway';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);

  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    mediaUrl?: string;
    platforms?: Array<'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'x'>;
    scheduleDate?: string;
  };
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ ok: false, error: 'Post text is required.' }, { status: 400 });

  const publishResults = await publishThroughGateway({
    portalSlug: auth.session.slug,
    text,
    mediaUrl: body.mediaUrl?.trim(),
    platforms: body.platforms,
    scheduleDate: body.scheduleDate?.trim(),
  });
  const results = publishResults.map((item) => ({
    ok: item.ok,
    provider: item.provider,
    id: item.id,
    account: {
      id: item.id || `${item.provider}:${item.platform || 'gateway'}`,
      platform: item.platform || item.provider,
      name: item.platform || item.provider,
    },
    error: item.error,
  }));
  const ok = results.some((item) => item.ok);
  return NextResponse.json(
    { ok, results },
    { status: ok ? 200 : 409 },
  );
}
