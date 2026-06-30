import { NextRequest, NextResponse } from 'next/server';
import { findPortalClientByEmail, getClientByPortalSlug, updateClientEngagementScore } from '@/lib/airtable';
import { findAdminAccount } from '@/lib/ea-admin-users';
import { makeAdminSessionCookie, signAdminSession } from '@/lib/ea-admin-auth';
import { getClientSuccessProfile } from '@/lib/client-success';
import { verifyMagicLinkToken } from '@/lib/magic-link';
import { makeSessionCookie, signSession } from '@/lib/ea-portal-auth';
import { emitPulseEvent } from '@/lib/pulse-bus';

export const dynamic = 'force-dynamic';

function loginUrl(origin: string, realm: 'admin' | 'portal' | 'simplifi', error: string, next?: string): URL {
  const path =
    realm === 'admin' ? '/admin/login' : realm === 'simplifi' ? '/simplifi/login' : '/portal/login';
  const url = new URL(path, origin);
  url.searchParams.set('error', error);
  if (next) url.searchParams.set('next', next);
  return url;
}

async function completePortalLogin(slug: string, recordId: string | undefined) {
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
        title: `Portal login — ${slug}`,
        detail: slug,
        priority: 'low',
        href: `/portal/${slug}`,
        tenantId: slug,
        objectId: recordId,
      });
    } catch (err) {
      console.error('Portal login side effects failed:', err);
    }
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const payload = verifyMagicLinkToken(token);
  const origin = req.nextUrl.origin;

  if (!payload) {
    return NextResponse.redirect(loginUrl(origin, 'portal', 'expired'), 303);
  }

  if (payload.realm === 'admin') {
    const account = await findAdminAccount(payload.email);
    if (!account) {
      return NextResponse.redirect(loginUrl(origin, 'admin', 'unauthorized', payload.next), 303);
    }

    let sessionToken: string;
    try {
      sessionToken = signAdminSession({
        email: account.email,
        name: account.name,
        role: account.role,
      });
    } catch {
      return NextResponse.redirect(loginUrl(origin, 'admin', 'config', payload.next), 303);
    }

    const next = payload.next?.startsWith('/admin') ? payload.next : '/admin/master';
    const res = NextResponse.redirect(new URL(next, origin), 303);
    res.cookies.set(makeAdminSessionCookie(sessionToken));
    return res;
  }

  const client = await findPortalClientByEmail(payload.email);
  if (!client.ok || !client.slug) {
    const realm = payload.realm === 'simplifi' ? 'simplifi' : 'portal';
    return NextResponse.redirect(loginUrl(origin, realm, 'unauthorized', payload.next), 303);
  }

  const sessionToken = await signSession(client.slug);
  if (!sessionToken) {
    const realm = payload.realm === 'simplifi' ? 'simplifi' : 'portal';
    return NextResponse.redirect(loginUrl(origin, realm, 'config', payload.next), 303);
  }

  void completePortalLogin(client.slug, client.recordId);

  const defaultNext =
    payload.realm === 'simplifi' ? '/simplifi/capture' : `/portal/${client.slug}`;
  const next = payload.next && payload.next.startsWith('/') ? payload.next : defaultNext;

  const res = NextResponse.redirect(new URL(next, origin), 303);
  res.cookies.set(makeSessionCookie(sessionToken));
  return res;
}
