import { NextRequest, NextResponse } from 'next/server';
import { validatePortalLogin, getClientByPortalSlug, updateClientEngagementScore } from '@/lib/airtable';
import { ensureDemoConnectTenant } from '@/lib/connect-provision';
import { ensureDemoClient, isDemoCredentialAttempt } from '@/lib/demo-client';
import {
  ensureDemoWebsitePortal,
  getDemoWebsitePortalCredentials,
} from '@/lib/demo-website-portal';
import { begin2FA, is2FAEnabled } from '@/lib/ea-auth-2fa';
import { signSession, makeSessionCookie } from '@/lib/ea-portal-auth';
import { getClientSuccessProfile } from '@/lib/client-success';
import { notifyPortal } from '@/lib/portal-notify';
import { resolvePortalIdentity } from '@/lib/org-provision';
import { resolvePortalPostLoginPath } from '@/lib/portal-post-login';
import { getAmandaAssignedAudience } from '@/lib/amanda-catherine/client-access';

export const dynamic = 'force-dynamic';

function isDemoWebsiteCredentialAttempt(email: string, password: string): boolean {
  const demo = getDemoWebsitePortalCredentials();
  return email === demo.email && password === demo.password;
}

function isAmandaLearningTarget(next?: string) {
  return next?.toLowerCase().startsWith('/portal/amanda-catherine/learning') ?? false;
}

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

  if (!result.ok && isDemoWebsiteCredentialAttempt(email, password)) {
    const provision = await ensureDemoWebsitePortal();
    if (provision.ok) {
      result = await validatePortalLogin(email, password);
    }
  }

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

  // A paid Amanda learner can already have an older EA portal record with a
  // personalized slug. When they arrive from the Amanda course link, keep the
  // authenticated identity but issue the session for the canonical Amanda
  // learning tenant. Without this normalization the portal middleware sends
  // the browser back to the older slug instead of opening the course.
  const assignedAmandaAccess = isAmandaLearningTarget(nextPath)
    ? await getAmandaAssignedAudience('amanda-catherine', email)
    : null;
  const sessionSlug = assignedAmandaAccess ? 'amanda-catherine' : result.slug;

  const portalClient = await getClientByPortalSlug(sessionSlug);
  const defaultNext = await resolvePortalPostLoginPath(sessionSlug, portalClient);
  const skip2fa =
    isDemoCredentialAttempt(email, password) || isDemoWebsiteCredentialAttempt(email, password);

  // Demo credentials skip email 2FA so portal can be opened when inbox delivery fails.
  if (is2FAEnabled() && !skip2fa) {
    try {
      const pending = await begin2FA({
        realm: 'portal',
        email,
        data: {
          slug: sessionSlug,
          recordId: result.recordId ?? '',
          next: nextPath ?? defaultNext,
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
    slug: sessionSlug,
    clientRecordId: result.recordId,
  });

  const token = await signSession({
    slug: sessionSlug,
    orgId: identity.orgId,
    role: identity.role,
    email: identity.email,
  });
  if (!token) {
    return NextResponse.json({ error: 'Session signing failed.' }, { status: 500 });
  }

  if (result.recordId) {
    try {
      if (portalClient) {
        const profile = await getClientSuccessProfile(portalClient);
        const engagement = profile.scores.find((s) => s.id === 'engagement');
        if (engagement) await updateClientEngagementScore(result.recordId, engagement.value);
      }
      await notifyPortal({
        product: 'ea-platform',
        type: 'portal.login',
        title: `Portal login — ${portalClient?.clientName ?? sessionSlug}`,
        detail: portalClient?.email ?? sessionSlug,
        priority: 'low',
        href: defaultNext,
        tenantId: sessionSlug,
        objectId: result.recordId,
      });
    } catch (err) {
      console.error('Portal login side effects failed:', err);
    }
  }

  const destination = nextPath?.startsWith('/') ? nextPath : defaultNext;
  const res = NextResponse.json({ slug: sessionSlug, next: destination });
  res.cookies.set(makeSessionCookie(token));
  return res;
}
