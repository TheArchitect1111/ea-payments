import { NextRequest, NextResponse } from 'next/server';
import { authenticatePartner } from '@/lib/partner-portal-data';
import { makePartnerSessionCookie, signPartnerSession } from '@/lib/partner-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { slug?: string; password?: string };
  try {
    body = (await req.json()) as { slug?: string; password?: string };
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
