import { NextRequest } from 'next/server';
import { runRecoveryOrchestrator } from '@/lib/recovery/orchestrator';
import type { RecoveryFailureClass, RecoverySignal } from '@/lib/recovery/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.EA_RECOVERY_SIGNAL_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function failureClass(value: unknown): RecoveryFailureClass {
  const allowed: RecoveryFailureClass[] = ['route_unhealthy','deployment_drift','asset_missing','configuration_drift','provider_unavailable','unknown'];
  return typeof value === 'string' && allowed.includes(value as RecoveryFailureClass) ? value as RecoveryFailureClass : 'unknown';
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const target = typeof body.target === 'string' ? body.target.trim() : '';
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  if (!target || !summary) return Response.json({ error: 'target and summary are required' }, { status: 400 });

  const signal: RecoverySignal = {
    target,
    failureClass: failureClass(body.failureClass),
    source: body.source === 'runtime' ? 'runtime' : body.source === 'synthetic' ? 'synthetic' : 'monitoring',
    summary,
    route: typeof body.route === 'string' ? body.route : undefined,
    observedCommit: typeof body.observedCommit === 'string' ? body.observedCommit : undefined,
    observedValue: typeof body.observedValue === 'string' ? body.observedValue : undefined,
    expectedValue: typeof body.expectedValue === 'string' ? body.expectedValue : undefined,
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata as Record<string, unknown> : {},
  };

  const outcome = await runRecoveryOrchestrator({ signal, mode: 'dry_run' });
  return Response.json({
    ok: true,
    runId: outcome.runId,
    disposition: outcome.decision.disposition,
    action: outcome.decision.action ?? null,
    verificationOk: outcome.verification.ok,
    evidenceRecorded: outcome.evidenceRecorded,
  });
}
