import { NextRequest, NextResponse } from 'next/server';
import { verify2FACode } from '@/lib/ea-auth-2fa';
import { makeAdminSessionCookie, signAdminSession } from '@/lib/ea-admin-auth';
import { getClientByPortalSlug, updateClientEngagementScore } from '@/lib/airtable';
import { signSession, makeSessionCookie } from '@/lib/ea-portal-auth';
import { getClientSuccessProfile } from '@/lib/client-success';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { makePartnerSessionCookie, signPartnerSession } from '@/lib/partner-session';
import { resolveAdminIdentity, resolvePortalIdentity } from '@/lib/org-provision';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { pendingToken?: string; code?: string };
  try {
    body = (await req.json()) as { pendingToken?: string; code?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const pendingToken = (body.pendingToken ?? '').trim();
  const code = (body.code ?? '').trim();
  if (!pendingToken || !code) {
    return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
  }

  const payload = verify2FACode(pendingToken, code);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 401 });
  }

  try {
    if (payload.realm === 'admin') {
      const identity = resolveAdminIdentity({
        email: payload.email,
        role: payload.data.role || 'admin',
      });
      const res = NextResponse.json({ ok: true, next: payload.data.next || '/admin/master' });
      res.cookies.set(
        makeAdminSessionCookie(
          signAdminSession({
            email: payload.email,
            name: payload.data.name || payload.email,
            role: payload.data.role || 'admin',
            orgId: identity.orgId,
          }),
        ),
      );
      return res;
    }

    if (payload.realm === 'portal') {
      const slug = payload.data.slug;
      if (!slug) return NextResponse.json({ error: 'Invalid session.' }, { status: 400 });

      const identity = await resolvePortalIdentity({
        email: payload.email,
        slug,
        clientRecordId: payload.data.recordId,
      });

      const token = await signSession({
        slug,
        orgId: identity.orgId,
        role: identity.role,
        email: identity.email,
      });
      if (!token) return NextResponse.json({ error: 'Session signing failed.' }, { status: 500 });

      const recordId = payload.data.recordId;
      if (recordId) {
        try {
          const client = await getClientByPortalSlug(slug);
          if (client) {
            const profile = await getClientSuccessProfile(client);
            const engagement = profile.scores.find((s) => s.id === 'engagement');
            if (engagement) await updateClientEngagementScore(recordId, engagement.value);
          }
          await emitPulseEvent({
            product: 'ea-platform',
            type: 'portal.login',
            title: `Portal login — ${client?.clientName ?? slug}`,
            detail: client?.email ?? slug,
            priority: 'low',
            href: `/portal/${slug}`,
            tenantId: slug,
            objectId: recordId,
          });
        } catch (err) {
          console.error('Portal login side effects failed:', err);
        }
      }

      const destination = payload.data.next || `/portal/${slug}/ctp`;
      const res = NextResponse.json({ ok: true, slug, next: destination });
      res.cookies.set(makeSessionCookie(token));
      return res;
    }

    if (payload.realm === 'partner') {
      const slug = payload.data.slug;
      if (!slug) return NextResponse.json({ error: 'Invalid session.' }, { status: 400 });

      const token = await signPartnerSession({
        slug,
        partnerId: payload.data.partnerId || '',
        name: payload.data.name || slug,
        tier: payload.data.tier || '',
        commissionRate: payload.data.commissionRate ? Number(payload.data.commissionRate) : null,
      });
      if (!token) return NextResponse.json({ error: 'Session failed.' }, { status: 500 });
      const res = NextResponse.json({ slug });
      res.cookies.set(makePartnerSessionCookie(token));
      return res;
    }

    return NextResponse.json({ error: 'Invalid session.' }, { status: 400 });
  } catch (err) {
    console.error('2FA verify failed:', err);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}
