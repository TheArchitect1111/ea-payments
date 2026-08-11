import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const FRONTEND_URL = process.env.POSTIZ_FRONTEND_URL?.trim() || 'https://platform.postiz.com';
const API_BASE_URL = (process.env.POSTIZ_API_BASE_URL?.trim() || 'https://api.postiz.com').replace(/\/$/, '');

function encryptionKey(): Buffer {
  const secret = process.env.AMPLIFI_OAUTH_ENCRYPTION_KEY?.trim() || process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error('AMPLIFI_OAUTH_ENCRYPTION_KEY is not configured');
  return createHash('sha256').update(secret).digest();
}

export function postizConfigured(): boolean {
  return Boolean(process.env.POSTIZ_CLIENT_ID?.trim() && process.env.POSTIZ_CLIENT_SECRET?.trim());
}

export function postizAuthorizationUrl(state: string): string {
  const clientId = process.env.POSTIZ_CLIENT_ID?.trim();
  if (!clientId) throw new Error('POSTIZ_CLIENT_ID is not configured');
  const url = new URL('/oauth/authorize', FRONTEND_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangePostizCode(code: string): Promise<string> {
  const clientId = process.env.POSTIZ_CLIENT_ID?.trim();
  const clientSecret = process.env.POSTIZ_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error('Postiz OAuth is not configured');
  const response = await fetch(`${API_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'authorization_code', code, client_id: clientId, client_secret: clientSecret }),
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as { access_token?: string; message?: string };
  if (!response.ok || !data.access_token) throw new Error(data.message || 'Postiz authorization failed');
  return data.access_token;
}

export function encryptPostizToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((value) => value.toString('base64url')).join('.');
}

export function decryptPostizToken(value?: string): string | null {
  if (!value) return null;
  try {
    const [ivValue, tagValue, encryptedValue] = value.split('.');
    if (!ivValue || !tagValue || !encryptedValue) return null;
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export type PostizConnection = { id: string; platform: string; name: string; picture?: string };

export async function listPostizConnections(token: string): Promise<PostizConnection[]> {
  const response = await fetch(`${API_BASE_URL}/public/v1/integrations`, {
    headers: { Authorization: token },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Could not load Postiz social connections');
  const payload = (await response.json()) as unknown;
  const rows = Array.isArray(payload) ? payload : payload && typeof payload === 'object' && Array.isArray((payload as { integrations?: unknown[] }).integrations) ? (payload as { integrations: unknown[] }).integrations : [];
  return rows.flatMap((value) => {
    if (!value || typeof value !== 'object') return [];
    const row = value as Record<string, unknown>;
    const id = String(row.id ?? '');
    if (!id) return [];
    return [{
      id,
      platform: String(row.providerIdentifier ?? row.identifier ?? row.type ?? 'social'),
      name: String(row.name ?? row.displayName ?? row.username ?? 'Connected account'),
      ...(typeof row.picture === 'string' ? { picture: row.picture } : {}),
    }];
  });
}
