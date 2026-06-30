import { NextRequest, NextResponse } from 'next/server';
import { findPortalClientByEmail, getClientByPortalSlug, updateClientEngagementScore } from '@/lib/airtable';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { findAdminAccount } from '@/lib/ea-admin-users';
import { makeAdminSessionCookie, signAdminSession } from '@/lib/ea-admin-auth';
import { getClientSuccessProfile } from '@/lib/client-success';
import { createMagicLinkToken, magicLinkConfigured, type MagicLinkRealm } from '@/lib/magic-link';
import { makeSessionCookie, signSession } from '@/lib/ea-portal-auth';
import { emitPulseEvent } from '@/lib/pulse-bus';

export const dynamic = 'force-dynamic';

function siteOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return configured || req.nextUrl.origin;
}

function safeNextPath(raw: string | undefined, realm: MagicLinkRealm): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    if (realm === 'admin') return '/admin/master';
    if (realm === 'simplifi') return '/simplifi/capture';
    return '/portal/login';
  }
  if (realm === 'admin' && !raw.startsWith('/admin')) return '/admin/master';
  return raw;
}

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

  let authorized = false;
  let label = 'EA Portal';

  if (realm === 'admin') {
    authorized = Boolean(await findAdminAccount(email));
    label = 'EA Admin';
  } else {
    const client = await findPortalClientByEmail(email);
    authorized = client.ok;
    label = realm === 'simplifi' ? 'Simplifi' : 'EA Portal';
  }

  if (!authorized) {
    return NextResponse.json({
      ok: true,
      message: 'If that email is registered, a login link is on its way.',
    });
  }

  const token = createMagicLinkToken({ realm, email, next });
  if (!token) {
    return NextResponse.json({ error: 'Login is temporarily unavailable.' }, { status: 503 });
  }

  const link = `${siteOrigin(req)}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;
  const subject =
    realm === 'admin'
      ? 'Your EA admin login link'
      : realm === 'simplifi'
        ? 'Your Simplifi login link'
        : 'Your EA portal login link';

  const mail = await sendAuthEmail({
    to: email,
    subject,
    title: `Sign in to ${label}`,
    bodyHtml: `
      <p>Tap the button below to sign in. This link expires in 15 minutes.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="display:inline-block;background:#1B2B4D;color:#fff;padding:14px 24px;border-radius:6px;font-weight:700;text-decoration:none">
          Sign in to ${label}
        </a>
      </p>
      <p style="font-size:13px;color:#64748b">If you did not request this, you can ignore this email.</p>
    `,
    text: `Sign in to ${label}: ${link}`,
  });

  if (!mail.ok) {
    return NextResponse.json({ error: mail.error ?? 'Could not send login email.' }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Check your email — your login link is on the way.',
  });
}
