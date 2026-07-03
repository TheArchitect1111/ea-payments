import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { AuthRealm } from '@/lib/auth/types';
import type { PlatformRole } from '@/lib/rbac';
import {
  requirePortalSession,
  requirePortalSessionFromRequest,
} from '@/lib/auth/resolve-portal-session';

export type PortalApiSession = {
  slug: string;
  email?: string;
  orgId?: string;
  role?: PlatformRole;
  name?: string;
};

type GuardFail = { ok: false; status: number; error: string };
type GuardOk = { ok: true; session: PortalApiSession };

function validateSlug(session: PortalApiSession, slug?: string): GuardFail | null {
  if (slug && session.slug !== slug) {
    return { ok: false, status: 403, error: 'Portal access denied.' };
  }
  return null;
}

/** Portal API auth from NextRequest (POST/PATCH/DELETE handlers). */
export async function guardPortalApi(
  req: NextRequest,
  opts: { realm?: AuthRealm; slug?: string } = {},
): Promise<GuardOk | GuardFail> {
  const session = await requirePortalSessionFromRequest(req, opts);
  if (!session) {
    return { ok: false, status: 401, error: 'Please log in again.' };
  }
  const denied = validateSlug(session as PortalApiSession, opts.slug);
  if (denied) return denied;
  return { ok: true, session: session as PortalApiSession };
}

/** Portal API auth from cookies (GET handlers without request body). */
export async function guardPortalApiCookie(
  opts: { realm?: AuthRealm; slug?: string } = {},
): Promise<GuardOk | GuardFail> {
  const session = await requirePortalSession(opts);
  if (!session) {
    return { ok: false, status: 401, error: 'Please log in again.' };
  }
  const denied = validateSlug(session as PortalApiSession, opts.slug);
  if (denied) return denied;
  return { ok: true, session: session as PortalApiSession };
}

export function portalApiUnauthorized(result: GuardFail): NextResponse {
  return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
}
