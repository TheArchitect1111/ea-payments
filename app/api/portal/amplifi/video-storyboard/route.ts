import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { buildAmplifiVideoStoryboard } from '@/lib/amplifi-video-storyboard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const body = (await req.json().catch(() => ({}))) as { title?: string; transcript?: string; sourceUrl?: string };
  const sourceUrl = String(body.sourceUrl || '').trim();
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
    } catch {
      return NextResponse.json({ ok: false, error: 'Enter a valid public video URL.' }, { status: 400 });
    }
  }
  try {
    const result = await buildAmplifiVideoStoryboard({
      title: String(body.title || ''),
      transcript: String(body.transcript || ''),
      sourceUrl,
      context: {
        requestId: `storyboard_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        actor: { id: auth.session.sub || auth.session.email || auth.session.slug, type: 'portal', portalSlug: auth.session.slug },
        route: '/api/portal/amplifi/video-storyboard',
      },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Storyboard creation failed.' }, { status: 400 });
  }
}
