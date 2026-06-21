// Edge-safe session verification for middleware (matches lib/ea-portal-auth.ts token format).

export const EA_PORTAL_COOKIE = 'ea_portal_session';

export interface EAPortalSessionPayload {
  slug: string;
  exp: number;
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseBase64UrlJson<T>(encoded: string): T | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

export async function verifyEAPortalSessionEdge(
  token: string,
  secret: string,
): Promise<EAPortalSessionPayload | null> {
  if (!secret) return null;

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const encoded = token.slice(0, dotIdx);
  const provided = token.slice(dotIdx + 1);
  if (!encoded || !provided) return null;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encoded));
    const expected = hex(sigBytes);
    if (provided !== expected) return null;

    const payload = parseBase64UrlJson<EAPortalSessionPayload>(encoded);
    if (!payload) return null;

    if (typeof payload.slug !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
