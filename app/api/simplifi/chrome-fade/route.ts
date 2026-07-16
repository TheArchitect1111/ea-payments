import { NextResponse } from 'next/server';
import { CHROME_FADE_COOKIE, envChromeFadeEnabled } from '@/lib/simplifi/chrome-fade';

export const dynamic = 'force-dynamic';

/** Toggle Chrome Fade cookie (full nav remains the default). */
export async function POST(req: Request) {
  let enabled = false;
  try {
    const body = (await req.json()) as { enabled?: boolean };
    enabled = Boolean(body.enabled);
  } catch {
    enabled = false;
  }

  const res = NextResponse.json({ ok: true, enabled, mode: 'Chrome Fade' });
  res.cookies.set(CHROME_FADE_COOKIE, enabled ? '1' : '0', {
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
  const match = cookie.match(new RegExp(`${CHROME_FADE_COOKIE}=([^;]+)`));
  const fromCookie = match?.[1] === '1';
  const fromEnv = envChromeFadeEnabled();
  const q = url.searchParams.get('fade');
  const enabled =
    q === '1' || q === 'true' || q === 'on'
      ? true
      : q === '0' || q === 'false' || q === 'off'
        ? false
        : fromCookie || fromEnv;
  return NextResponse.json({
    ok: true,
    enabled,
    cookie: fromCookie,
    env: fromEnv,
  });
}
