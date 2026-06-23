import crypto from 'node:crypto';

export const EA_ADMIN_COOKIE = 'ea_admin_session';
const TTL_HOURS = 24;

export type AdminSessionUser = {
  email: string;
  name: string;
  role: string;
};

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? '';
}

function signPayload(encoded: string): string {
  const sec = secret();
  if (!sec) return '';
  return crypto.createHmac('sha256', sec).update(encoded).digest('hex');
}

export function signAdminSession(user?: AdminSessionUser): string {
  const sec = secret();
  if (!sec) throw new Error('ADMIN_SESSION_SECRET not configured.');

  const payload = user
    ? {
        email: user.email,
        name: user.name,
        role: user.role,
        mfa: true,
        exp: Date.now() + TTL_HOURS * 60 * 60 * 1000,
      }
    : { exp: Date.now() + TTL_HOURS * 60 * 60 * 1000 };

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = signPayload(encoded);
  if (!sig) throw new Error('ADMIN_SESSION_SECRET not configured.');
  return `${encoded}.${sig}`;
}

export function parseAdminSession(token: string | undefined): AdminSessionUser | null {
  if (!token) return null;
  const sec = secret();
  if (!sec) return null;

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const encoded = token.slice(0, dotIdx);
  const provided = token.slice(dotIdx + 1);

  try {
    const expectedSig = signPayload(encoded);
    if (!expectedSig || provided !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      email?: string;
      name?: string;
      role?: string;
      exp?: number;
    };
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (!payload.email) return { email: 'admin', name: 'Admin', role: 'owner' };
    return {
      email: payload.email,
      name: payload.name || payload.email,
      role: payload.role || 'admin',
    };
  } catch {
    return null;
  }
}

export function verifyAdminSession(token: string | undefined): boolean {
  return parseAdminSession(token) !== null;
}

export function makeAdminSessionCookie(token: string) {
  return {
    name: EA_ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TTL_HOURS * 60 * 60,
  };
}
