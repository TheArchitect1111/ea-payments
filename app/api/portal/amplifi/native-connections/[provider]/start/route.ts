import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { isNativeProvider, oauthStart, providerConfigs } from '@/lib/amplifi-native-social';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const { provider: value } = await context.params;
  if (!isNativeProvider(value)) return NextResponse.json({ ok: false, error: 'Unsupported provider.' }, { status: 404 });
  const configured = providerConfigs().find((item) => item.provider === value)?.configured;
  if (!configured) return NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-setup-required#connections`, req.url));
  const state = randomBytes(24).toString('base64url');
  const verifier = value === 'x' ? randomBytes(48).toString('base64url') : undefined;
  const oauthOrigin =
    process.env.AMPLIFI_PUBLIC_ORIGIN?.trim() ||
    (process.env.VERCEL_ENV === 'production' ? 'https://efficiencyarchitects.online' : req.nextUrl.origin);
  const response = NextResponse.redirect(oauthStart(value, oauthOrigin, state, verifier));
  const payload = JSON.stringify({
    state,
    verifier,
    digest: createHash('sha256').update(state).digest('hex'),
    returnOrigin: req.nextUrl.origin,
  });
  response.cookies.set(`amplifi_oauth_${value}`, Buffer.from(payload).toString('base64url'), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
    ...(req.nextUrl.hostname.endsWith('efficiencyarchitects.online')
      ? { domain: '.efficiencyarchitects.online' }
      : {}),
  });
  return response;
}
