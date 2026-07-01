import { findPortalClientByEmail, getClientByPortalSlug, updateClientEngagementScore } from '@/lib/airtable';
import { findAdminAccount } from '@/lib/ea-admin-users';
import { makeAdminSessionCookie, signAdminSession } from '@/lib/ea-admin-auth';
import { getClientSuccessProfile } from '@/lib/client-success';
import { verifyMagicLinkToken, type MagicLinkRealm } from '@/lib/magic-link';
import { makeSessionCookie, signSession } from '@/lib/ea-portal-auth';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { resolveAdminIdentity, resolvePortalIdentity } from '@/lib/org-provision';
import { normalizeAdminRole, normalizeRole } from '@/lib/rbac';
import type { SessionCookieOptions } from '@ea/portal-chassis/hmac';
import type { UnifiedSession } from './types';

type CookieSpec = SessionCookieOptions;

export type MagicLinkExchangeError = 'invalid' | 'expired' | 'unauthorized' | 'config';

export type MagicLinkExchangeResult =
  | { ok: false; realm: MagicLinkRealm; error: MagicLinkExchangeError; next?: string }
  | {
      ok: true;
      realm: MagicLinkRealm;
      token: string;
      cookie: CookieSpec;
      next: string;
      session: UnifiedSession;
      runSideEffects: () => void;
    };

async function completePortalLogin(slug: string, recordId: string | undefined): Promise<void> {
  if (!recordId) return;
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

/**
 * Verify a magic-link token and produce a realm session token + normalized
 * session. Shared by the web redirect route (sets cookie, 303 redirect) and
 * the JSON/Bearer route used by API + future mobile clients. Centralizing this
 * removes the prior duplication between the two flows.
 */
export async function exchangeMagicLinkToken(token: string): Promise<MagicLinkExchangeResult> {
  const payload = verifyMagicLinkToken(token);
  if (!payload) {
    return { ok: false, realm: 'portal', error: 'expired' };
  }

  if (payload.realm === 'admin') {
    const account = await findAdminAccount(payload.email);
    if (!account) {
      return { ok: false, realm: 'admin', error: 'unauthorized', next: payload.next };
    }
    let sessionToken: string;
    let orgId: string | undefined;
    try {
      const identity = resolveAdminIdentity({ email: account.email, role: account.role });
      orgId = identity.orgId;
      sessionToken = signAdminSession({
        email: account.email,
        name: account.name,
        role: account.role,
        orgId: identity.orgId,
      });
    } catch {
      return { ok: false, realm: 'admin', error: 'config', next: payload.next };
    }

    const next = payload.next?.startsWith('/admin') ? payload.next : '/admin/master';
    return {
      ok: true,
      realm: 'admin',
      token: sessionToken,
      cookie: makeAdminSessionCookie(sessionToken),
      next,
      session: {
        realm: 'admin',
        sub: account.email,
        email: account.email,
        name: account.name,
        role: normalizeAdminRole(account.role),
        orgId,
      },
      runSideEffects: () => {},
    };
  }

  const client = await findPortalClientByEmail(payload.email);
  if (!client.ok || !client.slug) {
    const realm = payload.realm === 'simplifi' ? 'simplifi' : 'portal';
    return { ok: false, realm, error: 'unauthorized', next: payload.next };
  }

  const identity = await resolvePortalIdentity({
    email: payload.email,
    slug: client.slug,
    clientRecordId: client.recordId,
  });

  const sessionToken = await signSession({
    slug: client.slug,
    orgId: identity.orgId,
    role: identity.role,
    email: identity.email,
  });
  if (!sessionToken) {
    const realm = payload.realm === 'simplifi' ? 'simplifi' : 'portal';
    return { ok: false, realm, error: 'config', next: payload.next };
  }

  const realm: MagicLinkRealm = payload.realm === 'simplifi' ? 'simplifi' : 'portal';
  const defaultNext = realm === 'simplifi' ? '/simplifi/capture' : `/portal/${client.slug}`;
  const next = payload.next && payload.next.startsWith('/') ? payload.next : defaultNext;
  const slug = client.slug;
  const recordId = client.recordId;

  return {
    ok: true,
    realm,
    token: sessionToken,
    cookie: makeSessionCookie(sessionToken),
    next,
    session: {
      realm,
      sub: identity.email ?? slug,
      email: identity.email,
      role: normalizeRole(identity.role),
      orgId: identity.orgId,
      slug,
    },
    runSideEffects: () => void completePortalLogin(slug, recordId),
  };
}
