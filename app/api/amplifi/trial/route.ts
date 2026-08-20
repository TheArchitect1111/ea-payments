import { NextResponse, type NextRequest } from 'next/server';
import { makeSessionCookie, signSession } from '@/lib/ea-portal-auth';

export const dynamic = 'force-dynamic';

const TRIAL_LENGTH_DAYS = 10;
const TRIAL_LENGTH_MS = TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000;

/**
 * Creates an isolated Amplifi tenant for each tester.
 *
 * This deliberately does not reuse the shared demo-client tenant: social
 * connections are stored by portal slug, so a unique slug prevents one
 * tester from seeing another organization's accounts or content.
 */
export async function GET(req: NextRequest) {
  const trialId = crypto.randomUUID();
  const slug = `amplifi-trial-${trialId}`;
  const expiresAt = Date.now() + TRIAL_LENGTH_MS;
  const token = await signSession({
    slug,
    orgId: `trial-${trialId}`,
    role: 'guest',
    email: `trial-${trialId}@amplifi.local`,
    exp: expiresAt,
  });

  if (!token) {
    return NextResponse.redirect(new URL('/portal/login?error=config', req.nextUrl.origin), 303);
  }

  const target = new URL('/amplifi/workspace?trial=started', req.nextUrl.origin);
  const response = NextResponse.redirect(target, 303);
  response.cookies.set({
    ...makeSessionCookie(token),
    maxAge: Math.floor(TRIAL_LENGTH_MS / 1000),
  });
  return response;
}
