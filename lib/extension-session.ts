import {
  signHmacSession,
  verifyHmacSession,
  newSessionExpiry,
} from '@ea/portal-chassis/hmac';
import {
  EA_EXTENSION_SESSION,
  EXTENSION_SESSION_SCOPE,
  EXTENSION_SESSION_TTL_MS,
} from '@/lib/chassis/ea-extension';

export interface EAExtensionSession {
  slug: string;
  orgId?: string;
  email?: string;
  scope: typeof EXTENSION_SESSION_SCOPE;
  exp: number;
  sid?: string;
}

export function extensionSessionExpiry(ttlMs = EXTENSION_SESSION_TTL_MS): number {
  return newSessionExpiry(ttlMs);
}

export async function signExtensionSession(
  input: Omit<EAExtensionSession, 'exp' | 'scope'> & { sid?: string },
): Promise<string | null> {
  const payload: EAExtensionSession = {
    slug: input.slug,
    orgId: input.orgId,
    email: input.email,
    sid: input.sid,
    scope: EXTENSION_SESSION_SCOPE,
    exp: extensionSessionExpiry(),
  };
  return signHmacSession(payload, EA_EXTENSION_SESSION);
}

export async function verifyExtensionSession(
  token: string,
): Promise<EAExtensionSession | null> {
  const session = await verifyHmacSession<EAExtensionSession>(token, EA_EXTENSION_SESSION);
  if (!session) return null;
  if (session.scope !== EXTENSION_SESSION_SCOPE) return null;
  if (!session.slug || typeof session.exp !== 'number') return null;
  if (session.exp < Date.now()) return null;
  return session;
}
