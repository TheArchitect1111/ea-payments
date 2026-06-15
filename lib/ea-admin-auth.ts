import crypto from 'node:crypto';

export const EA_ADMIN_COOKIE = 'ea_admin_session';
const TTL_HOURS = 24;

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? '';
}

export function signAdminSession(): string {
  const sec = secret();
  if (!sec) throw new Error('ADMIN_SESSION_SECRET not configured.');

  const payload = { exp: Date.now() + TTL_HOURS * 60 * 60 * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', sec).update(encoded).digest('hex');
  return `${encoded}.${sig}`;
}

export function verifyAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  const sec = secret();
  if (!sec) return false;

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return false;

  const encoded = token.slice(0, dotIdx);
  const provided = token.slice(dotIdx + 1);

  try {
    const expectedSig = crypto.createHmac('sha256', sec).update(encoded).digest('hex');
    const a = Buffer.from(provided.padEnd(expectedSig.length, '0').slice(0, expectedSig.length), 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b) || provided !== expectedSig) {
      return false;
    }
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { exp?: number };
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
