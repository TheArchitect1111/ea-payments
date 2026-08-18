import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi } from '@/lib/api/portal-route';
import { saveAmplifiConnections } from '@/lib/amplifi-connection-store';
import { encryptAccounts, exchangeProviderCode, isNativeProvider, providerCookie, verifyOAuthState } from '@/lib/amplifi-native-social';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider: value } = await context.params;
  if (!isNativeProvider(value)) return NextResponse.json({ ok: false, error: 'Unsupported provider.' }, { status: 404 });
  const url = new URL(req.url);
  const state = url.searchParams.get('state') || '';
  const raw = req.cookies.get(`amplifi_oauth_${value}`)?.value;
  let saved: { state?: string; verifier?: string; digest?: string; returnOrigin?: string } = {};
  try { saved = JSON.parse(Buffer.from(raw || '', 'base64url').toString('utf8')) as typeof saved; } catch { saved = {}; }
  const signedState = verifyOAuthState(state, value);
  const cookieState = Boolean(state && saved.state === state && saved.digest === createHash('sha256').update(state).digest('hex'));
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  const sessionState = Boolean(signedState && auth.ok && auth.session.slug === signedState.portalSlug);
  const validState = Boolean(signedState && (cookieState || sessionState));
  if (!validState) {
    return NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-state-expired#connections`, req.nextUrl.origin));
  }
  if (signedState) saved.returnOrigin = signedState.returnOrigin;
  if (url.searchParams.get('error') || !url.searchParams.get('code')) return NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-denied#connections`, req.url));
  try {
    const oauthOrigin =
      process.env.AMPLIFI_PUBLIC_ORIGIN?.trim() ||
      (process.env.VERCEL_ENV === 'production' ? 'https://efficiencyarchitects.online' : req.nextUrl.origin);
    const accounts = await exchangeProviderCode(value, url.searchParams.get('code') || '', oauthOrigin, saved.verifier);
    await saveAmplifiConnections(signedState!.portalSlug, value, accounts);
    let returnOrigin = req.nextUrl.origin;
    try {
      const candidate = new URL(saved.returnOrigin || '');
      if (candidate.hostname === 'efficiencyarchitects.online' || candidate.hostname.endsWith('.efficiencyarchitects.online')) {
        returnOrigin = candidate.origin;
      }
    } catch {
      // Use the verified callback origin.
    }
    const response = NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-connected#connections`, returnOrigin));
    const sharedCookie = req.nextUrl.hostname.endsWith('efficiencyarchitects.online')
      ? { domain: '.efficiencyarchitects.online' }
      : {};
    response.cookies.set(providerCookie(value), encryptAccounts(accounts), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      ...sharedCookie,
    });
    response.cookies.set(`amplifi_oauth_${value}`, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      ...sharedCookie,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-failed#connections`, req.url));
  }
}
