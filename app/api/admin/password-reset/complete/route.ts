import { NextRequest, NextResponse } from 'next/server';
import { resetAdminPassword } from '@/lib/ea-admin-users';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const token = String(form.get('token') || '').trim();
  const password = String(form.get('password') || '');
  const confirm = String(form.get('confirm') || '');

  const loginUrl = new URL('/admin/login', req.nextUrl.origin);

  if (!email || !token || !password) {
    loginUrl.searchParams.set('error', '1');
    return NextResponse.redirect(loginUrl, 303);
  }
  if (password !== confirm) {
    const url = new URL('/admin/reset-password', req.nextUrl.origin);
    url.searchParams.set('email', email);
    url.searchParams.set('token', token);
    url.searchParams.set('error', 'mismatch');
    return NextResponse.redirect(url, 303);
  }

  try {
    await resetAdminPassword(email, token, password);
    loginUrl.searchParams.set('reset', '1');
    return NextResponse.redirect(loginUrl, 303);
  } catch (err) {
    console.error('Admin password reset failed:', err);
    const url = new URL('/admin/reset-password', req.nextUrl.origin);
    url.searchParams.set('email', email);
    url.searchParams.set('token', token);
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url, 303);
  }
}
