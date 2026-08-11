import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { encryptAccounts, exchangeProviderCode, isNativeProvider, providerCookie } from '@/lib/amplifi-native-social';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider: value } = await context.params;
  if (!isNativeProvider(value)) return NextResponse.json({ ok: false, error: 'Unsupported provider.' }, { status: 404 });
  const url = new URL(req.url);
  const state = url.searchParams.get('state') || '';
  const raw = req.cookies.get(`amplifi_oauth_${value}`)?.value;
  let saved: { state?: string; verifier?: string; digest?: string } = {};
  try { saved = JSON.parse(Buffer.from(raw || '', 'base64url').toString('utf8')) as typeof saved; } catch { saved = {}; }
  const validState = Boolean(state && saved.state === state && saved.digest === createHash('sha256').update(state).digest('hex'));
  if (!validState) return NextResponse.json({ ok: false, error: 'Invalid OAuth state.' }, { status: 403 });
  if (url.searchParams.get('error') || !url.searchParams.get('code')) return NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-denied#connections`, req.url));
  try {
    const accounts = await exchangeProviderCode(value, url.searchParams.get('code') || '', req.nextUrl.origin, saved.verifier);
    const response = NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-connected#connections`, req.url));
    response.cookies.set(providerCookie(value), encryptAccounts(accounts), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, path: '/' });
    response.cookies.delete(`amplifi_oauth_${value}`);
    return response;
  } catch {
    return NextResponse.redirect(new URL(`/amplifi/workspace?connections=${value}-failed#connections`, req.url));
  }
}
