import crypto from 'node:crypto';

/**
 * Explicit EA_CAPTURE_API_KEY, or a stable key derived from ADMIN_SESSION_SECRET
 * so the Chrome extension works when only session secrets are configured on Vercel.
 */
export function getCaptureApiKey(): string | null {
  const explicit = process.env.EA_CAPTURE_API_KEY?.trim();
  if (explicit) return explicit;

  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) return null;

  return crypto.createHmac('sha256', secret).update('ea-capture-v1').digest('hex').slice(0, 48);
}

export function isCaptureApiKeyConfigured(): boolean {
  return getCaptureApiKey() !== null;
}
