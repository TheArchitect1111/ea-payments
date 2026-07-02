import { NextRequest, NextResponse } from 'next/server';
import { processDueConnectSequences } from '@/lib/connect-sequence-runner';
import { logConnectNurtureRun } from '@/lib/connect-nurture-log';export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

/** Vercel Cron — sends due Connect nurture emails (Day 3 / 7 / 14, etc.). */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processDueConnectSequences();
  const run = await logConnectNurtureRun(result, 'cron');

  return NextResponse.json({ ok: true, ...result, runAt: run.at });}
