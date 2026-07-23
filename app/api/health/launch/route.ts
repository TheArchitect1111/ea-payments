import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionFromRequest } from '@/lib/admin-session-guard';
import { buildLaunchHealthDiagnostic } from '@/lib/launch-health';

export const dynamic = 'force-dynamic';

/**
 * Public: `{ ok, status }` only.
 * Full diagnostic: authenticated EA administrator (cookie or Bearer admin session).
 * Query params / non-admin headers never expand the payload.
 */
export async function GET(req: NextRequest) {
  const { summary, diagnostic } = await buildLaunchHealthDiagnostic();

  const auth = await requireAdminSessionFromRequest(req);
  if (auth.ok) {
    return NextResponse.json(diagnostic);
  }

  // Explicitly ignore expand attempts — public callers always get the minimal body.
  void req.nextUrl.searchParams;
  void req.headers.get('x-ea-launch-detail');
  void req.headers.get('x-launch-setup-key');

  return NextResponse.json(summary);
}
