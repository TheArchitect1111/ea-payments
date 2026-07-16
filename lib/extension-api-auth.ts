import { cookies } from 'next/headers';
import { CAPTURE_CORS_HEADERS, verifyCaptureTenantToken } from '@/lib/capture-auth';
import { EA_PORTAL_COOKIE, verifySession, type EAPortalSession } from '@/lib/ea-portal-auth';
import {
  verifyExtensionSession,
  type EAExtensionSession,
} from '@/lib/extension-session';

export const EXTENSION_API_CORS_HEADERS = {
  ...CAPTURE_CORS_HEADERS,
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-EA-Extension-Token, X-EA-Capture-Key, X-EA-Portal-Slug, X-EA-Realm',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export type ExtensionAccess =
  | { kind: 'portal'; session: EAPortalSession; portalSlug: string }
  | { kind: 'extension'; session: EAExtensionSession; portalSlug: string }
  | { kind: 'legacy'; portalSlug: string };

function extractBearer(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function extractExtensionToken(req: Request): string | null {
  return (
    req.headers.get('x-ea-extension-token')?.trim() ||
    extractBearer(req) ||
    null
  );
}

/** Resolve portal cookie, extension session, or legacy capture tenant token. */
export async function resolveExtensionAccess(req: Request): Promise<ExtensionAccess | null> {
  const extensionToken = extractExtensionToken(req);
  if (extensionToken) {
    const session = await verifyExtensionSession(extensionToken);
    if (session) {
      return { kind: 'extension', session, portalSlug: session.slug };
    }
  }

  const cookieStore = await cookies();
  const portalToken = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  if (portalToken) {
    const session = await verifySession(portalToken);
    if (session?.slug) {
      return { kind: 'portal', session, portalSlug: session.slug };
    }
  }

  const legacyKey = req.headers.get('x-ea-capture-key');
  const legacySlug = verifyCaptureTenantToken(legacyKey);
  if (legacySlug) {
    return { kind: 'legacy', portalSlug: legacySlug };
  }

  return null;
}

/** Ensure requested slug (if any) matches the authenticated tenant. */
export function assertExtensionTenant(
  access: ExtensionAccess,
  requestedSlug?: string | null,
): string | null {
  const portalSlug = access.portalSlug;
  if (!portalSlug) return null;
  if (requestedSlug && requestedSlug.trim().toLowerCase() !== portalSlug.toLowerCase()) {
    return null;
  }
  return portalSlug;
}
