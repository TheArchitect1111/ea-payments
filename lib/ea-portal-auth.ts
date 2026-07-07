import {
  signHmacSession,
  verifyHmacSession,
  makeSessionCookie as makeChassisSessionCookie,
  newSessionExpiry,
} from '@ea/portal-chassis/hmac';
import type { PlatformRole } from '@/lib/rbac';
import { EA_PORTAL_COOKIE, EA_PORTAL_SESSION } from '@/lib/chassis/ea-portal';

export { EA_PORTAL_COOKIE };

export interface EAPortalSession {
  slug: string;
  exp: number;
  orgId?: string;
  role?: PlatformRole;
  email?: string;
}

export type PortalSessionInput = {
  slug: string;
  orgId?: string;
  role?: PlatformRole;
  email?: string;
};

/** Chassis treats VERCEL_ENV=production as prod even under `next dev`. Unset for local signing. */
async function withLocalDevSessionSecrets<T>(fn: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV !== 'development') return fn();

  const vercelEnv = process.env.VERCEL_ENV;
  const shouldUnset = vercelEnv === 'production' && !process.env.SESSION_SECRET?.trim();
  if (!shouldUnset) return fn();

  try {
    delete process.env.VERCEL_ENV;
    return await fn();
  } finally {
    process.env.VERCEL_ENV = vercelEnv;
  }
}

export async function signSession(
  input: string | PortalSessionInput,
): Promise<string | null> {
  const payload: EAPortalSession =
    typeof input === 'string'
      ? { slug: input, exp: newSessionExpiry() }
      : {
          slug: input.slug,
          orgId: input.orgId,
          role: input.role,
          email: input.email,
          exp: newSessionExpiry(),
        };

  return withLocalDevSessionSecrets(() => signHmacSession(payload, EA_PORTAL_SESSION));
}

export async function verifySession(token: string): Promise<EAPortalSession | null> {
  return withLocalDevSessionSecrets(() => verifyHmacSession<EAPortalSession>(token, EA_PORTAL_SESSION));
}

export function makeSessionCookie(value: string) {
  return makeChassisSessionCookie(EA_PORTAL_COOKIE, value);
}

export function newExpiry(): number {
  return newSessionExpiry();
}
