import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { buildConnectLaunchReadiness } from '@/lib/connect-launch-readiness';
import { runConnectProductionMatrix } from '@/lib/connect-matrix-run';
import { logConnectNurtureRun } from '@/lib/connect-nurture-log';
import { processDueConnectSequences } from '@/lib/connect-sequence-runner';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

async function requireAdminManage() {
  const cookieStore = await cookies();
  return requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
}

/** Connect launch checklist — current readiness without side effects. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  const orgSlug = request.nextUrl.searchParams.get('org')?.trim() || 'demo-client';
  const readiness = await buildConnectLaunchReadiness(orgSlug);
  return NextResponse.json({ ok: readiness.ready, ...readiness });
}

/** Finish line: clear nurture backlog, run full matrix, return launch checklist. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  let body: { orgSlug?: string; count?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // defaults
  }

  const orgSlug = body.orgSlug?.trim() || 'demo-client';
  const count = Number.isFinite(body.count) ? Math.max(1, Math.min(50, Number(body.count))) : 20;

  const nurture = await processDueConnectSequences();
  await logConnectNurtureRun(nurture, 'admin-run', { tenantId: orgSlug, note: 'Connect launch finish line' });

  const matrixRun = await runConnectProductionMatrix({
    orgSlug,
    count,
    reseed: true,
    tag: 'matrix-run',
  });

  const readiness = await buildConnectLaunchReadiness(orgSlug);

  return NextResponse.json({
    ok: readiness.ready,
    nurture,
    matrixRun,
    ...readiness,
  });
}
