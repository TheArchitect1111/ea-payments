import {
  signHmacSession,
  verifyHmacSession,
  makeSessionCookie as makeChassisSessionCookie,
  newSessionExpiry,
} from '@ea/portal-chassis/hmac';
import { EA_PARTNER_COOKIE, EA_PARTNER_SESSION, type EAPartnerSession } from './partner-portal-auth';

export { EA_PARTNER_COOKIE };

export async function signPartnerSession(session: Omit<EAPartnerSession, 'exp'>): Promise<string | null> {
  return signHmacSession({ ...session, exp: newSessionExpiry() }, EA_PARTNER_SESSION);
}

export async function verifyPartnerSession(token: string): Promise<EAPartnerSession | null> {
  return verifyHmacSession<EAPartnerSession>(token, EA_PARTNER_SESSION);
}

export function makePartnerSessionCookie(value: string) {
  return makeChassisSessionCookie(EA_PARTNER_COOKIE, value);
}
