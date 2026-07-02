import { NextRequest, NextResponse } from 'next/server';
import { clerkClient, verifyToken } from '@clerk/nextjs/server';
import { makeAdminSessionCookie, signAdminSession } from '@/lib/ea-admin-auth';
import { findAdminAccount } from '@/lib/ea-admin-users';
import { resolveAdminIdentity } from '@/lib/org-provision';

export const dynamic = 'force-dynamic';

/**
 * Exchanges a Clerk session (Google / magic-link sign-in) for the EA admin
 * session cookie, so all downstream admin code keeps working. Only emails that
 * resolve to an allowed admin account are accepted.
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.json({ error: 'Clerk sign-in is not configured.' }, { status: 503 });
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

  const account = await findAdminAccount(email);
  if (!account) {
    return NextResponse.json(
      { error: `${email || 'This account'} is not an authorized admin. Ask the owner to add you.` },
      { status: 403 },
    );
  }

  let sessionToken: string;
  try {
    const identity = resolveAdminIdentity({
      email: account.email,
      role: account.role,
    });
    sessionToken = signAdminSession({
      email: account.email,
      name: account.name,
      role: account.role,
      orgId: identity.orgId,
    });
  } catch {
    return NextResponse.json(
      { error: 'Admin session signing is not configured (set ADMIN_SESSION_SECRET).' },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true, email: account.email });
  res.cookies.set(makeAdminSessionCookie(sessionToken));
  return res;
}
