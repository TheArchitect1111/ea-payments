import type { NextRequest } from 'next/server';
import { normalizeRole, normalizeAdminRole } from '@/lib/rbac';
import { verifySession as verifyPortalToken, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { parseAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { verifyPartnerSession, EA_PARTNER_COOKIE } from '@/lib/partner-session';
import type { AuthRealm, UnifiedSession } from './types';

/** Cookie name per realm (portal + simplifi share the portal cookie). */
export const REALM_COOKIE: Record<AuthRealm, string> = {
  portal: EA_PORTAL_COOKIE,
  simplifi: EA_PORTAL_COOKIE,
  admin: EA_ADMIN_COOKIE,
  partner: EA_PARTNER_COOKIE,
};

/** Order used when probing an unhinted Bearer token or multiple cookies. */
const REALM_PRIORITY: AuthRealm[] = ['admin', 'portal', 'partner'];
const AUTH_REALMS = new Set<AuthRealm>(['admin', 'portal', 'simplifi', 'partner']);

function authRealm(value: string | null): AuthRealm | undefined {
  return value && AUTH_REALMS.has(value as AuthRealm) ? (value as AuthRealm) : undefined;
}

/** Extract a Bearer token from an Authorization header. */
export function getBearerToken(headers: Headers): string | null {
  const raw = headers.get('authorization') || headers.get('Authorization');
  if (!raw) return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match ? match[1].trim() : null;
}

/**
 * Verify a token against a specific realm and normalize it.
 * Delegates to the existing per-realm verifiers (no re-signing).
 */
export async function verifyRealmToken(
  realm: AuthRealm,
  token: string,
): Promise<UnifiedSession | null> {
  if (!token) return null;

  if (realm === 'admin') {
    const admin = parseAdminSession(token);
    if (!admin) return null;
    return {
      realm: 'admin',
      sub: admin.email,
      email: admin.email,
      name: admin.name,
      role: normalizeAdminRole(admin.role),
      orgId: admin.orgId,
    };
  }

  if (realm === 'partner') {
    const partner = await verifyPartnerSession(token);
    if (!partner) return null;
    return {
      realm: 'partner',
      sub: partner.partnerId,
      name: partner.name,
      role: normalizeRole('manager'),
      slug: partner.slug,
      partnerId: partner.partnerId,
      tier: partner.tier,
      exp: partner.exp,
    };
  }

  // portal | simplifi (shared chassis HMAC cookie)
  const portal = await verifyPortalToken(token);
  if (!portal) return null;
  return {
    realm,
    sub: portal.email ?? portal.slug,
    email: portal.email,
    role: normalizeRole(portal.role),
    orgId: portal.orgId,
    slug: portal.slug,
    exp: portal.exp,
  };
}

/** Probe a token across realms (used for unhinted Bearer tokens). */
async function verifyAnyRealm(
  token: string,
  hint?: AuthRealm,
): Promise<UnifiedSession | null> {
  const order = hint ? [hint] : REALM_PRIORITY;
  for (const realm of order) {
    const session = await verifyRealmToken(realm, token);
    if (session) return session;
  }
  return null;
}

type SessionSource = {
  headers: Headers;
  cookies: { get(name: string): { value: string } | undefined };
};

/**
 * Resolve the active session from EITHER an Authorization Bearer token
 * (API / future mobile) OR a realm cookie (web). Bearer takes precedence.
 *
 * Pass a hint via the `X-EA-Realm` header to disambiguate, or rely on
 * the realm-priority probe. Returns null when unauthenticated.
 */
export async function resolveSession(
  source: SessionSource,
  opts: { realm?: AuthRealm } = {},
): Promise<UnifiedSession | null> {
  const rawHeaderRealm = source.headers.get('x-ea-realm');
  const headerRealm = authRealm(rawHeaderRealm);
  if (rawHeaderRealm && !headerRealm) return null;
  if (opts.realm && headerRealm && opts.realm !== headerRealm) return null;
  const hint = opts.realm ?? headerRealm;

  const bearer = getBearerToken(source.headers);
  if (bearer) {
    const fromBearer = await verifyAnyRealm(bearer, hint);
    if (fromBearer) return fromBearer;
  }

  const probe: AuthRealm[] = hint ? [hint] : REALM_PRIORITY;

  for (const realm of probe) {
    const cookie = source.cookies.get(REALM_COOKIE[realm])?.value;
    if (!cookie) continue;
    const session = await verifyRealmToken(realm, cookie);
    if (session) return session;
  }

  return null;
}

/** Convenience wrapper for Next route handlers that receive a NextRequest. */
export function resolveSessionFromRequest(
  req: NextRequest,
  opts: { realm?: AuthRealm } = {},
): Promise<UnifiedSession | null> {
  return resolveSession({ headers: req.headers, cookies: req.cookies }, opts);
}
