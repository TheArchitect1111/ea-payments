import { NextResponse } from 'next/server';
import { ORB_OS_PREVIEW_COOKIE } from '@/lib/orb-os';

export const dynamic = 'force-dynamic';

/** Toggle Orb OS Preview cookie (classic UI remains at /simplifi/workspace). */
export async function POST(req: Request) {
  let enabled = false;
  try {
    const body = (await req.json()) as { enabled?: boolean };
    enabled = Boolean(body.enabled);
  } catch {
    enabled = false;
  }

  const res = NextResponse.json({ ok: true, enabled, preview: 'Orb OS Preview' });
  res.cookies.set(ORB_OS_PREVIEW_COOKIE, enabled ? '1' : '0', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false,
  });
  return res;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${ORB_OS_PREVIEW_COOKIE}=([^;]+)`));
  const fromCookie = match?.[1] === '1';
  const fromEnv =
    process.env.NEXT_PUBLIC_ORB_OS_PREVIEW === '1' ||
    process.env.NEXT_PUBLIC_ORB_OS_PREVIEW === 'true';
  return NextResponse.json({
    ok: true,
    enabled: fromCookie || fromEnv || url.searchParams.get('orb') === '1',
    cookie: fromCookie,
    env: fromEnv,
  });
}
