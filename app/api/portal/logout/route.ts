import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const loginUrl = new URL('/portal/login', req.url);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.set({
    name: EA_PORTAL_COOKIE,
    value: '',
    maxAge: 0,
    path: '/',
  });
  return res;
}
