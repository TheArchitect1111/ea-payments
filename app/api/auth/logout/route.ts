import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { EA_PARTNER_COOKIE } from '@/lib/partner-session';

export const dynamic = 'force-dynamic';

/** JSON logout for web and mobile clients (Bearer clients discard token locally). */
export async function POST() {
  return jsonLogout();
}

export async function DELETE() {
  return jsonLogout();
}

function jsonLogout() {
  const res = NextResponse.json({ ok: true, authenticated: false });
  for (const name of [EA_PORTAL_COOKIE, EA_ADMIN_COOKIE, EA_PARTNER_COOKIE]) {
    res.cookies.set({ name, value: '', maxAge: 0, path: '/' });
  }
  return res;
}
