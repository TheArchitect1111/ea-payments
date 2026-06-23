import { NextRequest, NextResponse } from 'next/server';
import { resetPortalPassword } from '@/lib/ea-portal-password-reset';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const recordId = String(form.get('recordId') || '').trim();
  const token = String(form.get('token') || '').trim();
  const password = String(form.get('password') || '');
  const confirm = String(form.get('confirm') || '');

  const loginUrl = new URL('/portal/login', req.nextUrl.origin);

  if (!recordId || !token || !password) {
    loginUrl.searchParams.set('error', '1');
    return NextResponse.redirect(loginUrl, 303);
  }
  if (password !== confirm) {
    const url = new URL('/portal/reset-password', req.nextUrl.origin);
    url.searchParams.set('recordId', recordId);
    url.searchParams.set('token', token);
    url.searchParams.set('error', 'mismatch');
    return NextResponse.redirect(url, 303);
  }

  try {
    await resetPortalPassword(recordId, token, password);
    loginUrl.searchParams.set('reset', '1');
    return NextResponse.redirect(loginUrl, 303);
  } catch (err) {
    console.error('Portal password reset failed:', err);
    const url = new URL('/portal/reset-password', req.nextUrl.origin);
    url.searchParams.set('recordId', recordId);
    url.searchParams.set('token', token);
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url, 303);
  }
}
