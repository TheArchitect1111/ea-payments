import { NextRequest, NextResponse } from 'next/server';
import { clerkClient, verifyToken } from '@clerk/nextjs/server';
import { findPortalClientByEmail, getClientByPortalSlug, updateClientEngagementScore } from '@/lib/airtable';
import { getClientSuccessProfile } from '@/lib/client-success';
import { signSession, makeSessionCookie } from '@/lib/ea-portal-auth';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { resolvePortalIdentity } from '@/lib/org-provision';

export const dynamic = 'force-dynamic';

/**
 * Exchanges a Clerk session (Google / magic-link) for the EA portal session
 * cookie. Only emails that match a client portal record are accepted.
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.json({ error: 'Google sign-in is not configured.' }, { status: 503 });
  }

  let token = '';
  try {
    const body = (await req.json()) as { token?: string };
    token = String(body.token || '');
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (!token) return NextResponse.json({ error: 'Missing session token.' }, { status: 400 });

  let userId = '';
  try {
    const claims = await verifyToken(token, { secretKey });
    userId = String(claims.sub || '');
  } catch {
    return NextResponse.json({ error: 'Sign-in could not be verified.' }, { status: 401 });
  }
  if (!userId) return NextResponse.json({ error: 'Sign-in could not be verified.' }, { status: 401 });

  let email = '';
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    email =
      user.primaryEmailAddress?.emailAddress?.toLowerCase() ||
      user.emailAddresses[0]?.emailAddress?.toLowerCase() ||
      '';
  } catch {
    return NextResponse.json({ error: 'Could not read your account email.' }, { status: 502 });
  }

  const result = await findPortalClientByEmail(email);
  if (!result.ok || !result.slug) {
    return NextResponse.json(
      {
        error:
          result.error ||
          `${email || 'This account'} is not linked to a portal. Use the email from your welcome message or sign in with your password.`,
      },
      { status: 403 },
    );
  }

  const identity = await resolvePortalIdentity({
    email,
    slug: result.slug,
    clientRecordId: result.recordId,
  });

  const sessionToken = await signSession({
    slug: result.slug,
    orgId: identity.orgId,
    role: identity.role,
    email: identity.email,
  });
  if (!sessionToken) {
    return NextResponse.json({ error: 'Session signing failed.' }, { status: 500 });
  }

  if (result.recordId) {
    try {
      const client = await getClientByPortalSlug(result.slug);
      if (client) {
        const profile = await getClientSuccessProfile(client);
        const engagement = profile.scores.find((s) => s.id === 'engagement');
        if (engagement) await updateClientEngagementScore(result.recordId, engagement.value);
      }
      await emitPulseEvent({
        product: 'ea-platform',
        type: 'portal.login',
        title: `Portal login — ${client?.clientName ?? result.slug}`,
        detail: client?.email ?? result.slug,
        priority: 'low',
        href: `/portal/${result.slug}`,
        tenantId: result.slug,
        objectId: result.recordId,
      });
    } catch (err) {
      console.error('Portal Clerk login side effects failed:', err);
    }
  }

  const res = NextResponse.json({ ok: true, slug: result.slug, email });
  res.cookies.set(makeSessionCookie(sessionToken));
  return res;
}
