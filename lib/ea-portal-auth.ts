import crypto from 'node:crypto';

export const EA_PORTAL_COOKIE = 'ea_portal_session';
const TTL_HOURS = 24;

export interface EAPortalSession {
  slug: string;
  exp: number;
}

function secret(): string {
  return process.env.SESSION_SECRET ?? '';
}

export function signSession(slug: string): string {
  const sec = secret();
  if (!sec) throw new Error('SESSION_SECRET not configured.');

  const payload: EAPortalSession = {
    slug,
    exp: Date.now() + TTL_HOURS * 60 * 60 * 1000,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', sec).update(encoded).digest('hex');
  return `${encoded}.${sig}`;
}

export function verifySession(token: string): EAPortalSession | null {
  const sec = secret();
  if (!sec) return null;

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const encoded = token.slice(0, dotIdx);
  const provided = token.slice(dotIdx + 1);

  try {
    const expectedSig = crypto.createHmac('sha256', sec).update(encoded).digest('hex');
    const a = Buffer.from(provided.padEnd(expectedSig.length, '0').slice(0, expectedSig.length), 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b) || provided !== expectedSig) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as EAPortalSession;
    if (typeof payload.slug !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function newExpiry(): number {
  return Date.now() + TTL_HOURS * 60 * 60 * 1000;
}
