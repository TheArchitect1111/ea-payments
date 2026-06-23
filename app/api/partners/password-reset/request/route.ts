import { NextRequest, NextResponse } from 'next/server';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { requestPartnerPasswordReset } from '@/lib/ea-partner-password-reset';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const slug = String(form.get('slug') || '').trim().toLowerCase();
  const done = new URL('/partners/forgot-password', req.nextUrl.origin);
  done.searchParams.set('sent', '1');
  if (!slug) return NextResponse.redirect(done, 303);

  try {
    const reset = await requestPartnerPasswordReset(slug, req.nextUrl.origin);
    if (reset) {
      await sendAuthEmail({
        to: reset.email,
        subject: 'Reset your EA partner portal password',
        title: 'Reset your partner password',
        bodyHtml: `
          <p>Use this secure link to set a new partner portal password. The link expires in 30 minutes.</p>
          <p><a href="${reset.resetUrl}" style="display:inline-block;background:#1B2B4D;color:#fff;padding:10px 14px;border-radius:5px;text-decoration:none;font-weight:bold">Reset Password</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
        text: `Reset your partner password: ${reset.resetUrl}`,
      });
    }
    return NextResponse.redirect(done, 303);
  } catch (err) {
    console.error('Partner password reset request failed:', err);
    const url = new URL('/partners/forgot-password', req.nextUrl.origin);
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url, 303);
  }
}
