import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi } from '@/lib/api/portal-route';
import { loadAmplifiConnections, saveAmplifiConnections } from '@/lib/amplifi-connection-store';
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
    console.warn('Amplifi OAuth callback rejected', { provider: value, reason: 'state-expired' });
    return NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-state-expired#connections`, req.nextUrl.origin));
  }
  if (signedState) saved.returnOrigin = signedState.returnOrigin;
  if (url.searchParams.get('error') || !url.searchParams.get('code')) {
    console.warn('Amplifi OAuth callback rejected', { provider: value, reason: 'denied' });
    return NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-denied#connections`, req.url));
  }
  try {
    const oauthOrigin =
      process.env.AMPLIFI_PUBLIC_ORIGIN?.trim() ||
      (process.env.VERCEL_ENV === 'production' ? 'https://efficiencyarchitects.online' : req.nextUrl.origin);
    const accounts = await exchangeProviderCode(value, url.searchParams.get('code') || '', oauthOrigin, saved.verifier);
    await saveAmplifiConnections(signedState!.portalSlug, value, accounts);
    const connectionStatus = value === 'meta' && !accounts.some((account) => account.platform === 'instagram')
      ? `${value}-instagram-missing`
      : `${value}-connected`;
    console.info('Amplifi OAuth connection saved', { provider: value, platforms: accounts.map((account) => account.platform), connectionStatus });
    let returnOrigin = req.nextUrl.origin;
    try {
      const candidate = new URL(saved.returnOrigin || '');
      if (candidate.hostname === 'efficiencyarchitects.online' || candidate.hostname.endsWith('.efficiencyarchitects.online')) {
        returnOrigin = candidate.origin;
      }
    } catch {
      // Use the verified callback origin.
    }
    const response = NextResponse.redirect(new URL(`/amplifi/workspace?connections=${connectionStatus}#connections`, returnOrigin));
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Meta occasionally repeats the callback after the first request has already
    // exchanged its single-use code. Treat that replay as success when the
    // first request durably saved accounts for this tenant.
    if (value === 'meta' && message.includes('subcode=36009')) {
      try {
        const accounts = await loadAmplifiConnections(signedState!.portalSlug, value);
        if (accounts.length) {
          const status = accounts.some((account) => account.platform === 'instagram')
            ? `${value}-connected`
            : `${value}-instagram-missing`;
          console.info('Amplifi OAuth callback replay resolved from durable connections', {
            provider: value,
            platforms: accounts.map((account) => account.platform),
            status,
          });
          return NextResponse.redirect(
            new URL(`/amplifi/workspace?connections=${status}#connections`, req.nextUrl.origin),
          );
        }
      } catch (loadError) {
        console.error('Amplifi OAuth replay recovery failed', {
          provider: value,
          message: loadError instanceof Error ? loadError.message : 'Unknown error',
        });
      }
    }

    const reason = message.includes('eligible Facebook Page') ? 'no-pages' : 'failed';
    console.error('Amplifi OAuth connection failed', { provider: value, reason, message });
    return NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-${reason}#connections`, req.url));
  }
}
