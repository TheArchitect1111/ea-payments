import { NextRequest, NextResponse } from 'next/server';
import { validatePortalLogin, updateClientEngagementScore, getClientByPortalSlug } from '@/lib/airtable';
import { signSession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientSuccessProfile } from '@/lib/client-success';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = (body.password ?? '').trim();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const result = await validatePortalLogin(email, password);

  if (!result.ok || !result.slug) {
    return NextResponse.json(
      { error: result.error ?? 'Invalid credentials.' },
      { status: 401 }
    );
  }

  let token: string;
  try {
    token = signSession(result.slug);
  } catch {
    return NextResponse.json({ error: 'Session signing failed.' }, { status: 500 });
  }

  if (result.recordId) {
    try {
      const client = await getClientByPortalSlug(result.slug);
      if (client) {
        const profile = await getClientSuccessProfile(client);
        const engagement = profile.scores.find((s) => s.id === 'engagement');
        if (engagement) {
          await updateClientEngagementScore(result.recordId, engagement.value);
        }
      }
    } catch (err) {
      console.error('Engagement score sync on login:', err);
    }
  }

  const res = NextResponse.json({ slug: result.slug });
  res.cookies.set({
    name: EA_PORTAL_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });

  return res;
}
