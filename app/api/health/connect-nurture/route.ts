import { NextResponse } from 'next/server';
import { previewDueConnectSequences } from '@/lib/connect-sequence-runner';
import { getConnectSystemStatus } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

/** Readiness for Connect nurture cron + delivery providers (no sends). */
export async function GET() {
  const status = await getConnectSystemStatus();
  const nurture = await previewDueConnectSequences();
  const resendOk = status.checks.some((check) => check.label === 'Resend Email' && check.ok);
  const tenantOk = status.checks.some((check) => check.label === 'Tenant Storage' && check.ok);
  const cronSecretConfigured = Boolean(process.env.CRON_SECRET?.trim());

  return NextResponse.json({
    ok: resendOk && tenantOk && cronSecretConfigured,
    score: status.score,
    cron: {
      path: '/api/cron/connect-sequence',
      schedule: '0 14 * * *',
      secretConfigured: cronSecretConfigured,
    },
    nurture,
    checks: status.checks,
  });
}
