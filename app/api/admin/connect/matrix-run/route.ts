import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import {
  buildConnectMatrixFailureReport,
  runConnectProductionMatrix,
  summarizeMatrixChecks,
} from '@/lib/connect-matrix-run';
import { buildConnectTestMatrix } from '@/lib/connect-test-matrix';
import { getConnectSystemStatus } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

async function requireAdminManage() {
  const cookieStore = await cookies();
  return requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
}

/** Current matrix score + failure report without re-running steps. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  const orgSlug = request.nextUrl.searchParams.get('org')?.trim() || 'demo-client';
  const matrix = await buildConnectTestMatrix(orgSlug);
  const status = await getConnectSystemStatus();
  const report = buildConnectMatrixFailureReport({ orgSlug, matrix, status, steps: [] });

  return NextResponse.json({
    ok: report.passed,
    matrix,
    report,
    summary: summarizeMatrixChecks(matrix.checks),
  });
}

/** Full production matrix run: seed, engagement, nurture, memory, scored failure report. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  let body: { orgSlug?: string; count?: number; reseed?: boolean; tag?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // defaults below
  }

  const orgSlug = body.orgSlug?.trim() || 'demo-client';
  const count = Number.isFinite(body.count) ? Math.max(1, Math.min(50, Number(body.count))) : 20;

  try {
    const result = await runConnectProductionMatrix({
      orgSlug,
      count,
      reseed: body.reseed !== false,
      tag: body.tag?.trim() || 'matrix-run',
    });

    return NextResponse.json({
      ...result,
      summary: summarizeMatrixChecks(result.matrix.checks),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Matrix run failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
