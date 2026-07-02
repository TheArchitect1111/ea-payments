import crypto from 'node:crypto';
import { randomBytes } from 'node:crypto';

const RESET_TTL_MS = 30 * 60 * 1000;

function resetSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? '';
}

/** Signed reset token when Airtable token storage is unavailable. */
export function createAdminPasswordResetToken(email: string): string | null {
  const secret = resetSecret();
  if (!secret) return null;

  const normalized = email.trim().toLowerCase();
  const exp = Date.now() + RESET_TTL_MS;
  const nonce = randomBytes(16).toString('base64url');
  const payload = `${normalized}|${exp}|${nonce}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${nonce}.${exp}.${sig}`;
}

export function verifyAdminPasswordResetToken(email: string, token: string): boolean {
  const secret = resetSecret();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [nonce, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  const normalized = email.trim().toLowerCase();
  const payload = `${normalized}|${exp}|${nonce}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
