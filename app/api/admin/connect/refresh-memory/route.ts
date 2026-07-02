import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { buildConnectTestMatrix } from '@/lib/connect-test-matrix';
import { isConnectMemoryConfigured } from '@/lib/connect-relationship-memory';
import { refreshConnectRelationshipMemoryForOrg } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function requireAdminManage() {
  const cookieStore = await cookies();
  return requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
}

/** Refreshes living relationship profiles for an org (OpenAI when configured). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  let body: { orgSlug?: string; limit?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // defaults below
  }

  const orgSlug = body.orgSlug?.trim() || 'demo-client';
  const limit = Number.isFinite(body.limit) ? Math.max(1, Math.min(50, Number(body.limit))) : 25;
  const result = await refreshConnectRelationshipMemoryForOrg(orgSlug, limit);
  const matrix = await buildConnectTestMatrix(orgSlug);

  return NextResponse.json({
    ok: true,
    orgSlug,
    openaiConfigured: isConnectMemoryConfigured(),
    ...result,
    matrix,
  });
}
