import { NextRequest, NextResponse } from 'next/server';
import { exchangePostizCode, encryptPostizToken } from '@/lib/postiz-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const expectedState = req.cookies.get('amplifi_postiz_state')?.value;
  const code = url.searchParams.get('code');
  if (!state || !expectedState || state !== expectedState) return NextResponse.json({ ok: false, error: 'Invalid OAuth state.' }, { status: 403 });
  if (url.searchParams.get('error') || !code) return NextResponse.redirect(new URL('/amplifi/workspace?connections=denied#connections', req.url));
  try {
    const token = await exchangePostizCode(code);
    const response = NextResponse.redirect(new URL('/amplifi/workspace?connections=connected#connections', req.url));
    response.cookies.set('amplifi_postiz_token', encryptPostizToken(token), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, path: '/' });
    response.cookies.delete('amplifi_postiz_state');
    return response;
  } catch {
    return NextResponse.redirect(new URL('/amplifi/workspace?connections=failed#connections', req.url));
  }
}
