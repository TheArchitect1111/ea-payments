import { NextResponse, type NextRequest } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Returns the normalized session for the current request, resolved from an
 * Authorization Bearer token (API / future mobile) or a realm cookie (web).
 * 401 when unauthenticated.
 */
export async function GET(req: NextRequest) {
  const session = await resolveSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, session });
}
