import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  adminAuthJsonError,
  requireAdminSessionFromRequest,
} from '@/lib/admin-session-guard';

/** Standard admin API auth — use instead of inline verifyAdminSession. */
export async function guardAdminApi(req: NextRequest) {
  return requireAdminSessionFromRequest(req);
}

export function adminApiUnauthorized(
  result: { ok: false; status: number; error: string },
): NextResponse {
  return NextResponse.json(
    { ok: false, error: result.error },
    { status: result.status },
  );
}

export function adminApiForbidden(
  result: { ok: false; status: number; error: string },
): NextResponse {
  return adminAuthJsonError(result);
}
