import { NextRequest, NextResponse } from 'next/server';
import { begin2FA, is2FAEnabled } from '@/lib/ea-auth-2fa';
import { makeAdminSessionCookie, signAdminSession } from '@/lib/ea-admin-auth';
import { authenticateAdminAsync, adminUsers } from '@/lib/ea-admin-users';
import { resolveAdminIdentity } from '@/lib/org-provision';

export const dynamic = 'force-dynamic';

function resolveAdminEmail(email: string, password: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized) return normalized;
  const legacy = adminUsers()[0];
  if (legacy && legacy.password === password) return legacy.email;
  return (process.env.ADMIN_EMAIL || process.env.ADMIN_USER || 'admin').toLowerCase();
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; next?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string; next?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const password = (body.password ?? '').trim();
  const email = resolveAdminEmail(body.email ?? '', password);
  const nextPath = (body.next ?? '/admin/master').trim() || '/admin/master';

  if (!password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }

  const user = await authenticateAdminAsync(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  if (is2FAEnabled()) {
    try {
      const pending = await begin2FA({
        realm: 'admin',
        email: user.email,
        data: {
          name: user.name,
          role: user.role,
          next: nextPath,
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

  let token: string;
  try {
    const identity = resolveAdminIdentity({ email: user.email, role: user.role });
    token = signAdminSession({
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: identity.orgId,
    });
  } catch {
    return NextResponse.json({ error: 'Session signing failed.' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, next: nextPath });
  res.cookies.set(makeAdminSessionCookie(token));
  return res;
}
