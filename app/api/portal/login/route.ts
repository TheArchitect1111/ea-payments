import { NextRequest, NextResponse } from 'next/server';
import { validatePortalLogin, getClientByPortalSlug, updateClientEngagementScore } from '@/lib/airtable';
import { ensureDemoConnectTenant } from '@/lib/connect-provision';
import { ensureDemoClient, isDemoCredentialAttempt } from '@/lib/demo-client';
import { begin2FA, is2FAEnabled } from '@/lib/ea-auth-2fa';
import { signSession, makeSessionCookie } from '@/lib/ea-portal-auth';
import { getClientSuccessProfile } from '@/lib/client-success';
import { notifyPortal } from '@/lib/portal-notify';
import { resolvePortalIdentity } from '@/lib/org-provision';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; next?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string; next?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = (body.password ?? '').trim();
  const nextPath = body.next;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  let result = await validatePortalLogin(email, password);

  if (!result.ok && isDemoCredentialAttempt(email, password)) {
    const provision = await ensureDemoClient();
    if (provision.ok) {
      result = await validatePortalLogin(email, password);
    }
  }

  if (!result.ok || !result.slug) {
    return NextResponse.json({ error: result.error ?? 'Invalid credentials.' }, { status: 401 });
  }

  if (isDemoCredentialAttempt(email, password)) {
    try {
      await ensureDemoConnectTenant();
    } catch (err) {
      console.error('[connect] demo tenant ensure failed', err);
    }
  }

  if (is2FAEnabled() && !isDemoCredentialAttempt(email, password)) {
    try {
      const pending = await begin2FA({
        realm: 'portal',
        email,
        data: {
          slug: result.slug,
          recordId: result.recordId ?? '',
          next: nextPath ?? `/portal/${result.slug}`,
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

  const identity = await resolvePortalIdentity({
    email,
    slug: result.slug,
    clientRecordId: result.recordId,
  });

  const token = await signSession({
    slug: result.slug,
    orgId: identity.orgId,
    role: identity.role,
    email: identity.email,
  });
  if (!token) {
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
      await notifyPortal({
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
      console.error('Portal login side effects failed:', err);
    }
  }

  const res = NextResponse.json({ slug: result.slug });
  res.cookies.set(makeSessionCookie(token));
  return res;
}
