import {
  signHmacSession,
  verifyHmacSession,
  makeSessionCookie as makeChassisSessionCookie,
  newSessionExpiry,
} from '@ea/portal-chassis/hmac';
import { EA_PORTAL_COOKIE, EA_PORTAL_SESSION } from '@/lib/chassis/ea-portal';

export { EA_PORTAL_COOKIE };

export interface EAPortalSession {
  slug: string;
  exp: number;
}

export async function signSession(slug: string): Promise<string | null> {
  return signHmacSession({ slug, exp: newSessionExpiry() }, EA_PORTAL_SESSION);
}

export async function verifySession(token: string): Promise<EAPortalSession | null> {
  return verifyHmacSession<EAPortalSession>(token, EA_PORTAL_SESSION);
}

export function makeSessionCookie(value: string) {
  return makeChassisSessionCookie(EA_PORTAL_COOKIE, value);
}

export function newExpiry(): number {
  return newSessionExpiry();
}
