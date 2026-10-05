import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const portal = req.nextUrl.searchParams.get('portal') || 'amanda-catherine';
  if (portal !== 'amanda-catherine') return NextResponse.json({ error: 'Unsupported portal.' }, { status: 400 });
  const required = ['SQUARE_CLIENT_ID', 'SQUARE_CLIENT_SECRET', 'SQUARE_OAUTH_REDIRECT', 'SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) return NextResponse.json({ error: 'Square OAuth is not configured.', missing }, { status: 503 });
  const redirect = new URL(process.env.SQUARE_OAUTH_REDIRECT!);
  if (redirect.protocol !== 'https:' || redirect.origin !== req.nextUrl.origin || redirect.pathname !== '/api/square/callback') {
    return NextResponse.json({ error: 'SQUARE_OAUTH_REDIRECT must point to this deployment’s HTTPS /api/square/callback.' }, { status: 503 });
  }
  const session = verifySession(req.cookies.get(EA_PORTAL_COOKIE)?.value || '');
  if (session?.slug !== portal) return NextResponse.json({ error: 'Sign into Amanda’s portal before connecting Square.' }, { status: 401 });
  const state = randomBytes(32).toString('hex');
  const url = new URL('https://connect.squareup.com/oauth2/authorize');
  url.search = new URLSearchParams({ client_id: process.env.SQUARE_CLIENT_ID!, scope: 'MERCHANT_PROFILE_READ PAYMENTS_WRITE ORDERS_WRITE', state, session: 'false', redirect_uri: redirect.href }).toString();
  const response = NextResponse.redirect(url, 302);
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set('square_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/square', maxAge: 600 });
  return response;
}
