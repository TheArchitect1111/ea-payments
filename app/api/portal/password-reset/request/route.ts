import { NextRequest, NextResponse } from 'next/server';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { requestPortalPasswordReset } from '@/lib/ea-portal-password-reset';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const identifier = String(form.get('identifier') || form.get('email') || '').trim();
  const done = new URL('/portal/forgot-password', req.nextUrl.origin);
  done.searchParams.set('sent', '1');
  if (!identifier) return NextResponse.redirect(done, 303);

  try {
    const reset = await requestPortalPasswordReset(identifier, req.nextUrl.origin);
    if (reset) {
      await sendAuthEmail({
        to: reset.email,
        subject: 'Reset your EA client portal password',
        title: 'Reset your portal password',
        bodyHtml: `
          <p>Use this secure link to set a new portal password. The link expires in 30 minutes.</p>
          <p><a href="${reset.resetUrl}" style="display:inline-block;background:#1B2B4D;color:#fff;padding:10px 14px;border-radius:5px;text-decoration:none;font-weight:bold">Reset Password</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
        text: `Reset your portal password: ${reset.resetUrl}`,
      });
    }
    return NextResponse.redirect(done, 303);
  } catch (err) {
    console.error('Portal password reset request failed:', err);
    const url = new URL('/portal/forgot-password', req.nextUrl.origin);
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url, 303);
  }
}
