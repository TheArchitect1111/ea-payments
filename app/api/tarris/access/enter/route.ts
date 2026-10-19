import { NextRequest, NextResponse } from 'next/server';
import { TB3_ACCESS_COOKIE, validateAccessToken } from '@/lib/tb3/paid-access';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('entitlement') || '';
  try {
    const record = await validateAccessToken(token);
    if (!record) return new NextResponse('Access is invalid, expired, or revoked.', { status: 403, headers: { 'Cache-Control': 'no-store' } });
    const response = NextResponse.redirect(new URL('/learn/tb3', req.nextUrl.origin));
    const expiry = new Date(String(record.fields['Expires At']));
    response.cookies.set(TB3_ACCESS_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', expires: expiry });
    response.headers.set('Cache-Control', 'no-store'); response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch { return new NextResponse('Access verification is temporarily unavailable.', { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
