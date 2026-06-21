import { NextRequest, NextResponse } from 'next/server';
import { EA_PARTNER_COOKIE } from '@/lib/partner-portal-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const loginUrl = new URL('/partners/login', req.url);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.set({ name: EA_PARTNER_COOKIE, value: '', maxAge: 0, path: '/' });
  return res;
}
