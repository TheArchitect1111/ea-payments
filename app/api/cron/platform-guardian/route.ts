import { NextRequest } from 'next/server';
import { runPlatformGuardianAudit } from '@/lib/platform-guardian';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/**
 * Nightly Platform Guardian™ audit — Vercel Cron (0 6 * * *).
 * Set CRON_SECRET on Vercel; optional PLATFORM_GUARDIAN_EMAIL for brief recipient.
 */
export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sendDailyBrief = process.env.PLATFORM_GUARDIAN_CRON_EMAIL !== 'false';
  const report = await runPlatformGuardianAudit({
    probeRoutes: process.env.PLATFORM_GUARDIAN_PROBE_ROUTES === 'true',
    sendDailyBrief,
  });

  return Response.json({
    ok: report.ok,
    agent: 'platform-guardian',
    opsScore: report.opsScore,
    executiveSummary: report.executiveSummary,
    risks: report.risks.length,
    emailSent: report.emailSent,
    launchStatus: report.ops.launchStatus,
    readinessScore: report.ops.readinessScore,
    generatedAt: report.generatedAt,
  });
}
