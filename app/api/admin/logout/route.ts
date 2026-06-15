import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/admin/commissions', req.url));
  res.cookies.set({
    name: EA_ADMIN_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
