import { NextRequest, NextResponse } from 'next/server';
import { resetPartnerPassword } from '@/lib/ea-partner-password-reset';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const recordId = String(form.get('recordId') || '').trim();
  const slug = String(form.get('slug') || '').trim().toLowerCase();
  const token = String(form.get('token') || '').trim();
  const password = String(form.get('password') || '');
  const confirm = String(form.get('confirm') || '');

  const loginUrl = new URL('/partners/login', req.nextUrl.origin);

  if (!recordId || !slug || !token || !password) {
    loginUrl.searchParams.set('error', '1');
    return NextResponse.redirect(loginUrl, 303);
  }
  if (password !== confirm) {
    const url = new URL('/partners/reset-password', req.nextUrl.origin);
    url.searchParams.set('recordId', recordId);
    url.searchParams.set('slug', slug);
    url.searchParams.set('token', token);
    url.searchParams.set('error', 'mismatch');
    return NextResponse.redirect(url, 303);
  }

  try {
    await resetPartnerPassword(recordId, slug, token, password);
    loginUrl.searchParams.set('reset', '1');
    return NextResponse.redirect(loginUrl, 303);
  } catch (err) {
    console.error('Partner password reset failed:', err);
    const url = new URL('/partners/reset-password', req.nextUrl.origin);
    url.searchParams.set('recordId', recordId);
    url.searchParams.set('slug', slug);
    url.searchParams.set('token', token);
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url, 303);
  }
}
