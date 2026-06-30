import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type MagicLinkRealm = 'admin' | 'portal' | 'simplifi';

export type MagicLinkPayload = {
  realm: MagicLinkRealm;
  email: string;
  exp: number;
  nonce: string;
  next?: string;
};

const TTL_MS = 15 * 60 * 1000;

function signingSecret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() || '';
}

function sign(encoded: string, secret: string): string {
  return createHmac('sha256', secret).update(encoded).digest('base64url');
}

export function createMagicLinkToken(input: {
  realm: MagicLinkRealm;
  email: string;
  next?: string;
}): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const payload: MagicLinkPayload = {
    realm: input.realm,
    email: input.email.trim().toLowerCase(),
    exp: Date.now() + TTL_MS,
    nonce: randomBytes(16).toString('base64url'),
    next: input.next,
  };

  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifyMagicLinkToken(token: string): MagicLinkPayload | null {
  const secret = signingSecret();
  if (!secret) return null;

  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;

  const encoded = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(encoded, secret);

  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as MagicLinkPayload;
    if (!payload.email || !payload.realm || !payload.exp || payload.exp < Date.now()) return null;
    if (payload.realm !== 'admin' && payload.realm !== 'portal' && payload.realm !== 'simplifi') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function magicLinkConfigured(): boolean {
  return Boolean(signingSecret());
}
