import { NextResponse, type NextRequest } from 'next/server';
import { exchangeMagicLinkToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * JSON magic-link exchange — the API/mobile-friendly counterpart to the
 * web redirect route (`/api/auth/magic-link/verify`). Accepts a magic-link
 * token and returns a realm session token usable as a Bearer credential,
 * while also setting the realm cookie so the same call works for web.
 *
 * Body: { token: string }
 * 200:  { ok, realm, token, exp?, next, session }
 * 401:  { ok: false, error }
 */
export async function POST(req: NextRequest) {
  let body: { token?: unknown };
  try {
    body = (await req.json()) as { token?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const result = await exchangeMagicLinkToken(token);
  if (!result.ok) {
    const status = result.error === 'config' ? 500 : 401;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  result.runSideEffects();

  const res = NextResponse.json({
    ok: true,
    realm: result.realm,
    token: result.token,
    next: result.next,
    session: result.session,
  });
  res.cookies.set(result.cookie);
  return res;
}
