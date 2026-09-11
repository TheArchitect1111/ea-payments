import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminSessionFromRequest } from '@/lib/admin-session-guard';
import { recoveryOrchestratorStatus, runRecoveryOrchestrator } from '@/lib/recovery/orchestrator';
import type { RecoveryFailureClass, RecoverySignal } from '@/lib/recovery/types';

const FAILURE_CLASSES = new Set<RecoveryFailureClass>(['route_unhealthy','deployment_drift','asset_missing','configuration_drift','provider_unavailable','unknown']);

export async function GET(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) return adminAuthJsonError(auth);
  return NextResponse.json({ ok: true, status: recoveryOrchestratorStatus() });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) return adminAuthJsonError(auth);

  const body = (await req.json().catch(() => null)) as Partial<RecoverySignal> & { mode?: string } | null;
  if (!body?.target?.trim() || !body.summary?.trim() || !body.failureClass || !FAILURE_CLASSES.has(body.failureClass)) {
    return NextResponse.json({ ok: false, error: 'target, summary, and a valid failureClass are required.' }, { status: 400 });
  }
  if (body.mode === 'execute') {
    return NextResponse.json({ ok: false, error: 'Run 1 is certification-safe: direct autonomous mutation is locked until the self-heal certification run.' }, { status: 409 });
  }

  const signal: RecoverySignal = {
    target: body.target.trim(),
    failureClass: body.failureClass,
    source: body.source ?? 'admin',
    summary: body.summary.trim(),
    route: body.route,
    observedCommit: body.observedCommit,
    observedValue: body.observedValue,
    expectedValue: body.expectedValue,
    metadata: body.metadata,
  };
  const outcome = await runRecoveryOrchestrator({ signal, mode: 'dry_run' });
  return NextResponse.json({ ok: true, outcome });
}
