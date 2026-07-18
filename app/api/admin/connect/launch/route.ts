import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { buildConnectLaunchReadiness } from '@/lib/connect-launch-readiness';
import { runConnectProductionMatrix } from '@/lib/connect-matrix-run';
import { logConnectNurtureRun } from '@/lib/connect-nurture-log';
import { ensureConnectForPortal, ensureDemoConnectTenant } from '@/lib/connect-provision';
import { processDueConnectSequences } from '@/lib/connect-sequence-runner';
import {
  ensureConnectTenantStorage,
  remediateConnectExampleRelationships,
} from '@/lib/connect-store';
import { getDemoCredentials } from '@/lib/demo-client';

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

  let storageSetup: { ok: boolean; error?: string } | Awaited<ReturnType<typeof ensureConnectTenantStorage>> | null =
    null;
  try {
    storageSetup = await ensureConnectTenantStorage();
  } catch (error) {
    storageSetup = {
      ok: false,
      error: error instanceof Error ? error.message : 'Connect storage setup failed.',
    };
  }

  const tenant =
    orgSlug === 'demo-client'
      ? await ensureDemoConnectTenant()
      : await ensureConnectForPortal({
          portalSlug: orgSlug,
          organizationName: orgSlug,
          ownerEmail: getDemoCredentials().email,
          industry: 'business',
          sendWelcomeEmail: false,
        });

  if (!tenant.ok && orgSlug !== 'demo-client') {
    return NextResponse.json(
      {
        ok: false,
        error: tenant.error || `Connect tenant could not be ensured for "${orgSlug}".`,
        tenant,
        storageSetup,
      },
      { status: 500 },
    );
  }

  const exampleRemediation = await remediateConnectExampleRelationships();

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
    tenant,
    storageSetup,
    exampleRemediation,
    nurture,
    matrixRun,
    ...readiness,
  });
}
