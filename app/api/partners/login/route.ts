import { NextRequest, NextResponse } from 'next/server';
import { authenticatePartner } from '@/lib/partner-portal-data';
import { begin2FA, is2FAEnabled } from '@/lib/ea-auth-2fa';
import { makePartnerSessionCookie, signPartnerSession } from '@/lib/partner-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { slug?: string; password?: string; email?: string };
  try {
    body = (await req.json()) as { slug?: string; password?: string; email?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const slug = (body.slug ?? '').trim().toLowerCase();
  const password = (body.password ?? '').trim();

  if (!slug || !password) {
    return NextResponse.json({ error: 'Slug and password are required.' }, { status: 400 });
  }

  const result = await authenticatePartner(slug, password);
  if (!result.ok || !result.auth) {
    return NextResponse.json({ error: result.error ?? 'Invalid credentials.' }, { status: 401 });
  }

  const email =
    result.auth.email ||
    (body.email ?? '').trim().toLowerCase() ||
    `${slug}@partners.efficiencyarchitects.online`;

  if (is2FAEnabled()) {
    try {
      const pending = await begin2FA({
        realm: 'partner',
        email,
        data: {
          slug,
          partnerId: result.auth.partnerId,
          name: result.auth.profile.name,
          tier: result.auth.profile.tier,
          commissionRate: String(result.auth.profile.commissionRate ?? ''),
        },
      });
      return NextResponse.json({
        requires2fa: true,
        pendingToken: pending.pendingToken,
        maskedEmail: pending.maskedEmail,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Could not send verification code.' },
        { status: 503 },
      );
    }
  }

  const token = await signPartnerSession({
    slug,
    partnerId: result.auth.partnerId,
    name: result.auth.profile.name,
    tier: result.auth.profile.tier,
    commissionRate: result.auth.profile.commissionRate,
  });

  if (!token) {
    return NextResponse.json({ error: 'Session failed.' }, { status: 500 });
  }

  const res = NextResponse.json({ slug });
  res.cookies.set(makePartnerSessionCookie(token));
  return res;
}
