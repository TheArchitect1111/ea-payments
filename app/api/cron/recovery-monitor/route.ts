import { NextRequest } from 'next/server';
import { runRecoveryMonitoringCycle } from '@/lib/recovery/monitoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await runRecoveryMonitoringCycle();
  return Response.json({
    ok: result.ok,
    monitor: 'ea-recovery-monitor',
    checked: result.checked,
    failures: result.failures,
    outcomes: result.outcomes.map((outcome) => ({
      runId: outcome.runId,
      target: outcome.signal.target,
      failureClass: outcome.signal.failureClass,
      disposition: outcome.decision.disposition,
      action: outcome.decision.action ?? null,
      verificationOk: outcome.verification.ok,
      evidenceRecorded: outcome.evidenceRecorded,
    })),
    generatedAt: new Date().toISOString(),
  }, { status: result.ok ? 200 : 503 });
}
