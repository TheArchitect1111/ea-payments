import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { postizAuthorizationUrl, postizConfigured } from '@/lib/postiz-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!postizConfigured()) return NextResponse.redirect(new URL('/amplifi/workspace?connections=setup-required#connections', req.url));
  const state = randomBytes(24).toString('base64url');
  const response = NextResponse.redirect(postizAuthorizationUrl(state));
  response.cookies.set('amplifi_postiz_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
  return response;
}
