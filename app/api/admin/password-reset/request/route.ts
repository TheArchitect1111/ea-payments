import { NextRequest, NextResponse } from 'next/server';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { requestAdminPasswordReset } from '@/lib/ea-admin-users';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const done = new URL('/admin/forgot-password', req.nextUrl.origin);
  done.searchParams.set('sent', '1');
  if (!email) return NextResponse.redirect(done, 303);

  try {
    const resetUrl = await requestAdminPasswordReset(email, req.nextUrl.origin);
    if (resetUrl) {
      await sendAuthEmail({
        to: email,
        subject: 'Reset your EA admin password',
        title: 'Reset your admin password',
        bodyHtml: `
          <p>Use this secure link to set a new admin password. The link expires in 30 minutes.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#1B2B4D;color:#fff;padding:10px 14px;border-radius:5px;text-decoration:none;font-weight:bold">Reset Password</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
        text: `Reset your admin password: ${resetUrl}`,
      });
    }
    return NextResponse.redirect(done, 303);
  } catch (err) {
    console.error('Admin password reset request failed:', err);
    const url = new URL('/admin/forgot-password', req.nextUrl.origin);
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url, 303);
  }
}
