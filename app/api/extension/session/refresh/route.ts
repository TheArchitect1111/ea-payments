import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  EXTENSION_API_CORS_HEADERS,
  resolveExtensionAccess,
} from '@/lib/extension-api-auth';
import { signExtensionSession, verifyExtensionSession } from '@/lib/extension-session';

export const dynamic = 'force-dynamic';

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...EXTENSION_API_CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: EXTENSION_API_CORS_HEADERS });
}

/** Rotate a valid extension or portal session into a fresh 7-day extension token. */
export async function POST(req: NextRequest) {
  const access = await resolveExtensionAccess(req);
  if (!access) {
    return json({ ok: false, error: 'Connect Simplifi before refreshing the extension session.' }, { status: 401 });
  }

  const orgId =
    access.kind === 'extension'
      ? access.session.orgId
      : access.kind === 'portal'
        ? access.session.orgId
        : undefined;
  const email =
    access.kind === 'extension'
      ? access.session.email
      : access.kind === 'portal'
        ? access.session.email
        : undefined;

  const extensionToken = await signExtensionSession({
    slug: access.portalSlug,
    orgId,
    email,
    sid: randomUUID(),
  });
  if (!extensionToken) {
    return json({ ok: false, error: 'Could not mint extension session.' }, { status: 503 });
  }

  const verified = await verifyExtensionSession(extensionToken);
  return json({
    ok: true,
    extensionToken,
    tokenExpiresAt: verified?.exp ?? null,
    portalSlug: access.portalSlug,
  });
}
