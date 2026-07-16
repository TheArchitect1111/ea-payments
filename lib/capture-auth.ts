import crypto from 'node:crypto';
import { getCaptureApiKey } from '@/lib/capture-api-key';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function verifyCaptureApiKey(provided: string | null | undefined): boolean {
  const expected = getCaptureApiKey();
  return Boolean(expected && provided && safeEqual(provided, expected));
}

export function createCaptureTenantToken(portalSlug: string): string | null {
  const secret = getCaptureApiKey();
  const slug = portalSlug.trim().toLowerCase();
  if (!secret || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(slug)) return null;
  const encoded = Buffer.from(slug).toString('base64url');
  const signature = crypto.createHmac('sha256', secret)
    .update(`capture-tenant:v1:${encoded}`)
    .digest('base64url');
  return `v1.${encoded}.${signature}`;
}

export function verifyCaptureTenantToken(
  provided: string | null | undefined,
): string | null {
  const secret = getCaptureApiKey();
  if (!secret || !provided) return null;
  const [version, encoded, signature, extra] = provided.split('.');
  if (version !== 'v1' || !encoded || !signature || extra) return null;
  const expected = crypto.createHmac('sha256', secret)
    .update(`capture-tenant:v1:${encoded}`)
    .digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  const slug = Buffer.from(encoded, 'base64url').toString('utf8');
  return /^[a-z0-9][a-z0-9_-]{0,127}$/.test(slug) ? slug : null;
}

export const CAPTURE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, X-EA-Capture-Key, X-EA-Extension-Token, X-EA-Portal-Slug, Authorization, X-EA-Realm',
};
