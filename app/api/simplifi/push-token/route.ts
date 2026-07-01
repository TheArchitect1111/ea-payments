import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';
import { savePushToken, type PushPlatform } from '@/lib/push-token-store';

export const dynamic = 'force-dynamic';

const PLATFORMS = new Set<PushPlatform>(['ios', 'android', 'web', 'expo']);

/** Register a device push token for Simplifi alerts (Expo / FCM / APNs). */
export async function POST(req: NextRequest) {
  const session = await requirePortalSessionFromRequest(req, { realm: 'simplifi' });
  if (!session?.email) {
    return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 });
  }

  const body = (await req.json()) as { token?: string; platform?: string };
  const token = (body.token ?? '').trim();
  const platform = (body.platform ?? 'expo').trim().toLowerCase() as PushPlatform;

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Push token is required.' }, { status: 400 });
  }
  if (!PLATFORMS.has(platform)) {
    return NextResponse.json({ ok: false, error: 'Invalid platform.' }, { status: 400 });
  }

  const result = await savePushToken({
    slug: session.slug,
    email: session.email,
    token,
    platform,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: 'Could not save push token.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    persisted: result.persisted,
    platform,
  });
}
