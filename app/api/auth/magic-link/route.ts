import { NextRequest, NextResponse } from 'next/server';
import { findPortalClientByEmail } from '@/lib/airtable';
import { findAdminAccount } from '@/lib/ea-admin-users';
import { begin2FA } from '@/lib/ea-auth-2fa';
import { authSiteOrigin } from '@/lib/auth/site-origin';
import { createMagicLinkToken, magicLinkConfigured, type MagicLinkRealm } from '@/lib/magic-link';
import { sendAuthEmail } from '@/lib/ea-auth-email';

export const dynamic = 'force-dynamic';

const PORTAL_AUTH_DEAD_ENDS = new Set([
  '/portal/login',
  '/portal/sign-in',
  '/portal/register',
  '/portal/forgot-password',
  '/portal/reset-password',
]);

function safeNextPath(raw: string | undefined, realm: MagicLinkRealm): string | undefined {
  if (raw?.startsWith('simplifi://') && realm === 'simplifi') {
    return raw;
  }
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    if (realm === 'admin') return '/admin/master';
    if (realm === 'simplifi') return '/simplifi/capture';
    return undefined;
  }
  if (realm === 'admin' && !raw.startsWith('/admin')) return '/admin/master';
  if (realm === 'portal' && PORTAL_AUTH_DEAD_ENDS.has(raw.split('?')[0] ?? raw)) {
    return undefined;
  }
  return raw;
}

/**
 * Portal + admin: email a 6-digit code (typed on the login page).
 * Avoids Outlook Safe Links / broken href click-through failures.
 *
 * Simplifi (and mobile deep links): keep one-tap magic links.
 */
export async function POST(req: NextRequest) {
  if (!magicLinkConfigured()) {
    return NextResponse.json(
      { error: 'Login is not configured. Set ADMIN_SESSION_SECRET on Vercel Production.' },
      { status: 503 },
    );
  }

  let body: { email?: string; realm?: string; next?: string };
  try {
    body = (await req.json()) as { email?: string; realm?: string; next?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const realm: MagicLinkRealm =
    body.realm === 'admin' ? 'admin' : body.realm === 'simplifi' ? 'simplifi' : 'portal';
  const next = safeNextPath(body.next, realm);

  if (!email) {
    return NextResponse.json({ error: 'Enter your email address.' }, { status: 400 });
  }

  if (realm === 'admin') {
    const account = await findAdminAccount(email);
    if (!account) {
      return NextResponse.json(
        { error: 'That email is not registered as an EA admin.' },
        { status: 404 },
      );
    }
    try {
      const started = await begin2FA({
        realm: 'admin',
        email,
        data: {
          role: account.role || 'admin',
          name: account.name || email,
          next: next || '/admin/master',
        },
      });
      return NextResponse.json({
        ok: true,
        mode: 'otp',
        pendingToken: started.pendingToken,
        maskedEmail: started.maskedEmail,
        message: 'Check your email for a 6-digit code.',
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Could not send login code.' },
        { status: 503 },
      );
    }
  }

  if (realm === 'portal') {
    const client = await findPortalClientByEmail(email);
    if (!client.ok || !client.slug) {
      const missingAirtable = !process.env.AIRTABLE_API_KEY?.trim();
      if (process.env.NODE_ENV === 'development' && missingAirtable) {
        return NextResponse.json(
          {
            error:
              'Dev setup incomplete: add AIRTABLE_API_KEY and RESEND_API_KEY to .env.local. No email was sent.',
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        {
          error:
            'No portal account matches that email. Use the Email / Portal Username on the Client Record (or demo@efficiencyarchitects.online for the demo).',
        },
        { status: 404 },
      );
    }

    const defaultNext = `/portal/${client.slug}/ctp`;
    try {
      const started = await begin2FA({
        realm: 'portal',
        email,
        data: {
          slug: client.slug,
          recordId: client.recordId || '',
          next: next || defaultNext,
        },
      });
      return NextResponse.json({
        ok: true,
        mode: 'otp',
        pendingToken: started.pendingToken,
        maskedEmail: started.maskedEmail,
        message: 'Check your email for a 6-digit code.',
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Could not send login code.' },
        { status: 503 },
      );
    }
  }

  // Simplifi — keep magic link (mobile deep-link next=simplifi://…)
  const client = await findPortalClientByEmail(email);
  if (!client.ok) {
    return NextResponse.json(
      { error: 'No Simplifi account matches that email.' },
      { status: 404 },
    );
  }

  const token = createMagicLinkToken({ realm: 'simplifi', email, next });
  if (!token) {
    return NextResponse.json({ error: 'Login is temporarily unavailable.' }, { status: 503 });
  }

  const link = `${authSiteOrigin(req)}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;
  const mail = await sendAuthEmail({
    to: email,
    subject: 'Your Simplifi login link',
    title: 'Sign in to Simplifi',
    bodyHtml: `
      <p>Tap the button below to sign in. This link expires in 2 hours.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="display:inline-block;background:#1B2B4D;color:#fff;padding:14px 24px;border-radius:6px;font-weight:700;text-decoration:none">
          Sign in to Simplifi
        </a>
      </p>
    `,
    text: `Sign in to Simplifi: ${link}`,
  });

  if (!mail.ok) {
    return NextResponse.json({ error: mail.error ?? 'Could not send login email.' }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    mode: 'link',
    message: 'Check your email — your login link is on the way.',
  });
}
