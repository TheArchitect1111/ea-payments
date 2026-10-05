import { createCipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';

export const dynamic = 'force-dynamic';

function encrypt(token: string, secret: string): string {
  const iv = randomBytes(12);
  const key = createHash('sha256').update(secret).digest();
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export async function GET(req: NextRequest) {
  function finish(response: NextResponse) {
    response.cookies.set('square_oauth_state', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/square', maxAge: 0 });
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }
  const state = req.nextUrl.searchParams.get('state') || '';
  const expected = req.cookies.get('square_oauth_state')?.value || '';
  const session = verifySession(req.cookies.get(EA_PORTAL_COOKIE)?.value || '');
  if (!/^[a-f0-9]{64}$/.test(state) || expected.length !== state.length || !timingSafeEqual(Buffer.from(state), Buffer.from(expected)) || session?.slug !== 'amanda-catherine') {
    return finish(NextResponse.json({ error: 'Invalid or expired Square authorization. Start again from Amanda’s portal.' }, { status: 400 }));
  }
  if (req.nextUrl.searchParams.has('error')) return finish(NextResponse.json({ error: 'Square authorization was declined.' }, { status: 400 }));
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return finish(NextResponse.json({ error: 'Square authorization code is missing.' }, { status: 400 }));
  const clientId = process.env.SQUARE_CLIENT_ID, clientSecret = process.env.SQUARE_CLIENT_SECRET, redirect = process.env.SQUARE_OAUTH_REDIRECT;
  const base = process.env.AIRTABLE_PAYMENTS_BASE_ID || process.env.AIRTABLE_BASE_ID;
  const airtableToken = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  const encryptionSecret = process.env.SESSION_SECRET;
  if (!clientId || !clientSecret || !redirect || !base || !airtableToken || !encryptionSecret) return finish(NextResponse.json({ error: 'Square connection storage is not configured.' }, { status: 503 }));
  try {
    if (new URL(redirect).origin !== req.nextUrl.origin) throw new Error('redirect');
    const tokenResponse = await fetch('https://connect.squareup.com/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Square-Version': '2026-09-16' }, body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirect }), cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!tokenResponse.ok) throw new Error('exchange');
    const token = await tokenResponse.json();
    if (!token.access_token || !token.merchant_id || !token.refresh_token || !token.expires_at) throw new Error('token');
    const locationsResponse = await fetch('https://connect.squareup.com/v2/locations', { headers: { Authorization: `Bearer ${token.access_token}`, 'Square-Version': '2026-09-16' }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!locationsResponse.ok) throw new Error('locations');
    const locations = (await locationsResponse.json()).locations || [];
    const active = locations.filter((location: { status: string; merchant_id: string }) => location.status === 'ACTIVE' && location.merchant_id === token.merchant_id);
    if (active.length !== 1) throw new Error('Select one active Square location before connecting.');
    const fields = { portal: 'amanda-catherine', access_token: encrypt(token.access_token, encryptionSecret), refresh_token: encrypt(token.refresh_token, encryptionSecret), location_id: active[0].id, merchant_id: token.merchant_id, expires_at: token.expires_at };
    const saved = await fetch(`https://api.airtable.com/v0/${base}/Square_Connections`, { method: 'PATCH', headers: { Authorization: `Bearer ${airtableToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ performUpsert: { fieldsToMergeOn: ['portal'] }, records: [{ fields }] }), cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!saved.ok) throw new Error('storage');
    return finish(NextResponse.redirect(new URL('/portal/amanda-catherine?connected=true', req.url), 302));
  } catch {
    // Never log authorization codes, merchant tokens, or provider response bodies.
    return finish(NextResponse.json({ error: 'Square connection could not be saved. Verify OAuth settings, one active merchant location, and Airtable access, then reconnect.' }, { status: 502 }));
  }
}
