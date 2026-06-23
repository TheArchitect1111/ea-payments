import crypto from 'node:crypto';
import { maskEmail, sendAuthEmail } from '@/lib/ea-auth-email';

export type AuthRealm = 'admin' | 'portal' | 'partner';

export type Pending2FAPayload = {
  realm: AuthRealm;
  email: string;
  codeHash: string;
  exp: number;
  data: Record<string, string>;
};

const TTL_MS = 10 * 60 * 1000;

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? '';
}

function signPayload(encoded: string): string {
  const sec = secret();
  if (!sec) return '';
  return crypto.createHmac('sha256', sec).update(encoded).digest('hex');
}

export function is2FAEnabled(): boolean {
  if (process.env.EA_AUTH_2FA_DISABLED === '1') return false;
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function signPending2FA(payload: Pending2FAPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = signPayload(encoded);
  if (!sig) throw new Error('ADMIN_SESSION_SECRET not configured.');
  return `${encoded}.${sig}`;
}

export function verifyPending2FA(token: string): Pending2FAPayload | null {
  const sec = secret();
  if (!sec || !token) return null;

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const encoded = token.slice(0, dotIdx);
  const provided = token.slice(dotIdx + 1);
  const expected = signPayload(encoded);
  if (!expected || provided !== expected) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Pending2FAPayload;
    if (!payload.email || !payload.codeHash || !payload.realm || !payload.exp) return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function begin2FA(input: {
  realm: AuthRealm;
  email: string;
  data: Record<string, string>;
}): Promise<{ pendingToken: string; maskedEmail: string }> {
  const code = generateOtp();
  const payload: Pending2FAPayload = {
    realm: input.realm,
    email: input.email.trim().toLowerCase(),
    codeHash: hashOtp(code),
    exp: Date.now() + TTL_MS,
    data: input.data,
  };

  const emailResult = await sendAuthEmail({
    to: payload.email,
    subject: 'Your Efficiency Architects verification code',
    title: 'Two-factor verification',
    bodyHtml: `
      <p>Your sign-in verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#1B2B4D;">${code}</p>
      <p>This code expires in 10 minutes. If you did not try to sign in, you can ignore this email.</p>
    `,
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });

  if (!emailResult.ok) {
    throw new Error(emailResult.error ?? 'Could not send verification code.');
  }

  return {
    pendingToken: signPending2FA(payload),
    maskedEmail: maskEmail(payload.email),
  };
}

export function verify2FACode(token: string, code: string): Pending2FAPayload | null {
  const payload = verifyPending2FA(token);
  if (!payload) return null;
  const normalized = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return null;
  if (hashOtp(normalized) !== payload.codeHash) return null;
  return payload;
}
