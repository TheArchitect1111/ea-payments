import { NextRequest } from 'next/server';
import { runEaProjectStatusChecks } from '@/lib/ea-project-status-monitor.mjs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  if (process.env.EA_STATUS_PUBLIC === 'true') return true;
  const secret = process.env.EA_STATUS_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const report = await runEaProjectStatusChecks();
  return Response.json(report, {
    status: report.ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
