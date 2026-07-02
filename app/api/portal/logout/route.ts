import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { EA_PARTNER_COOKIE } from '@/lib/partner-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (wantsJson(req)) {
    return jsonLogout();
  }
  return redirectLogout(req);
}

export async function POST(req: NextRequest) {
  return jsonLogout();
}

export async function DELETE(req: NextRequest) {
  if (wantsJson(req)) {
    return jsonLogout();
  }
  return redirectLogout(req);
}

function wantsJson(req: NextRequest): boolean {
  const accept = req.headers.get('accept') ?? '';
  return accept.includes('application/json') || Boolean(getBearerToken(req));
}

function getBearerToken(req: NextRequest): string | null {
  const raw = req.headers.get('authorization');
  if (!raw) return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match?.[1]?.trim() ?? null;
}

function jsonLogout() {
  const res = NextResponse.json({ ok: true, authenticated: false });
  clearAuthCookies(res);
  return res;
}

function redirectLogout(req: NextRequest) {
  const loginUrl = new URL('/portal/login', req.url);
  const res = NextResponse.redirect(loginUrl);
  clearAuthCookies(res);
  return res;
}

function clearAuthCookies(res: NextResponse) {
  for (const name of [EA_PORTAL_COOKIE, EA_ADMIN_COOKIE, EA_PARTNER_COOKIE]) {
    res.cookies.set({ name, value: '', maxAge: 0, path: '/' });
  }
}
