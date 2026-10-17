import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, signSession } from '@/lib/ea-portal-auth';

export const dynamic = 'force-dynamic';

/**
 * Temporary V3.1 synthetic-student session bootstrap.
 * Isolated to the specific Preview branch; never enabled in production.
 * Remove when V3.1 acceptance evidence is captured.
 */
export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'poc/amanda-v31-identity-bridge') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const secret = process.env.FRAPPE_BRIDGE_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 });
  }
  const presented = req.headers.get('x-test-secret') ?? '';
  const expectedHash = createHash('sha256').update(secret).digest();
  const presentedHash = createHash('sha256').update(presented).digest();
  if (!timingSafeEqual(expectedHash, presentedHash)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const session = await signSession({
    slug: 'amanda-catherine',
    email: 'test@amandacatherine.ca',
    exp: Date.now() + 10 * 60 * 1000,
  });
  if (!session) return NextResponse.json({ error: 'Session unavailable' }, { status: 503 });

  const response = NextResponse.json({ ok: true, email: 'test@amandacatherine.ca' }, {
    headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' },
  });
  response.cookies.set(EA_PORTAL_COOKIE, session, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
