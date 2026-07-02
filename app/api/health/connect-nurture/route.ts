import { NextResponse } from 'next/server';
import { getConnectDeliveryStatus } from '@/lib/connect-delivery-log';
import { listConnectFollowUpTasks } from '@/lib/connect-tasks';
import { getConnectNurtureRunStatus } from '@/lib/connect-nurture-log';
import { previewDueConnectSequences } from '@/lib/connect-sequence-runner';
import { buildConnectTestMatrix } from '@/lib/connect-test-matrix';
import { getConnectSystemStatus } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

/** Readiness for Connect nurture cron + delivery providers (no sends). */
export async function GET() {
  const status = await getConnectSystemStatus();
  const nurture = await previewDueConnectSequences();
  const matrix = await buildConnectTestMatrix('demo-client');
  const runs = await getConnectNurtureRunStatus();
  const delivery = await getConnectDeliveryStatus('demo-client');
  const tasks = await listConnectFollowUpTasks('demo-client');
  const resendOk = status.checks.some((check) => check.label === 'Resend Email' && check.ok);
  const tenantOk = status.checks.some((check) => check.label === 'Tenant Storage' && check.ok);
  const cronSecretConfigured = Boolean(process.env.CRON_SECRET?.trim());

  const actions: string[] = [];
  if (!cronSecretConfigured) {
    actions.push('Set CRON_SECRET in Vercel Production — required for daily /api/cron/connect-sequence.');
  }
  if (nurture.dueSteps > 0) {
    actions.push(
      `POST /api/admin/connect/run-nurture (admin) to send ${nurture.dueSteps} due step(s) now.`,
    );
  }
  if (delivery.recentFailures.length > 0) {
    actions.push(
      `GET /api/admin/connect/delivery-log?org=demo-client — ${delivery.recentFailures.length} recent delivery failure(s).`,
    );
  }
  if (tasks.stats.open > 0) {
    actions.push(
      `${tasks.stats.open} open follow-up task(s) for demo-client — staff can complete them in portal Connect or via POST /api/admin/connect/tasks.`,
    );
  }
  if (matrix.score < 100) {
    actions.push(`GET /api/admin/connect/test-matrix?org=demo-client (current score ${matrix.score}).`);
  }

  return NextResponse.json({
    ok: resendOk && tenantOk && cronSecretConfigured && delivery.recentFailures.length === 0,
    score: status.score,
    cron: {
      path: '/api/cron/connect-sequence',
      schedule: '0 14 * * *',
      secretConfigured: cronSecretConfigured,
    },
    nurture,
    delivery,
    tasks: tasks.stats,
    lastRun: runs.lastRun,
    recentRuns: runs.recentRuns,
    runLogSource: runs.source,
    matrix,
    actions,
    checks: status.checks,
  });
}
