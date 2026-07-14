import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type MagicLinkRealm = 'admin' | 'portal' | 'simplifi';

export type MagicLinkPayload = {
  realm: MagicLinkRealm;
  email: string;
  exp: number;
  nonce: string;
  next?: string;
};

/** Default login-link window — long enough for email delay / inbox lag. */
const TTL_MS = 2 * 60 * 60 * 1000;
/** Longer TTL for post-purchase welcome emails (buyer may open hours later). */
export const WELCOME_MAGIC_LINK_TTL_MS = 48 * 60 * 60 * 1000;

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
  /** Override default 2-hour expiry (ms from now). */
  ttlMs?: number;
}): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const ttl = typeof input.ttlMs === 'number' && input.ttlMs > 0 ? input.ttlMs : TTL_MS;
  const payload: MagicLinkPayload = {
    realm: input.realm,
    email: input.email.trim().toLowerCase(),
    exp: Date.now() + ttl,
    nonce: randomBytes(16).toString('base64url'),
    next: input.next,
  };

  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded, secret)}`;
}

export type MagicLinkVerifyFailure = 'missing_secret' | 'invalid' | 'expired';

export type MagicLinkVerifyResult =
  | { ok: true; payload: MagicLinkPayload }
  | { ok: false; error: MagicLinkVerifyFailure };

export function verifyMagicLinkTokenDetailed(token: string): MagicLinkVerifyResult {
  const secret = signingSecret();
  if (!secret) return { ok: false, error: 'missing_secret' };

  const dot = token.lastIndexOf('.');
  if (dot < 0) return { ok: false, error: 'invalid' };

  const encoded = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(encoded, secret);

  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: 'invalid' };
    }
  } catch {
    return { ok: false, error: 'invalid' };
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as MagicLinkPayload;
    if (!payload.email || !payload.realm || !payload.exp) {
      return { ok: false, error: 'invalid' };
    }
    if (payload.realm !== 'admin' && payload.realm !== 'portal' && payload.realm !== 'simplifi') {
      return { ok: false, error: 'invalid' };
    }
    if (payload.exp < Date.now()) {
      return { ok: false, error: 'expired' };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, error: 'invalid' };
  }
}

export function verifyMagicLinkToken(token: string): MagicLinkPayload | null {
  const result = verifyMagicLinkTokenDetailed(token);
  return result.ok ? result.payload : null;
}

export function magicLinkConfigured(): boolean {
  return Boolean(signingSecret());
}
