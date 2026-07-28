import { NextRequest, NextResponse } from 'next/server';
import { processDueEventRegistrationReminders } from '@/lib/events/registration-reminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

/** Vercel Cron — pretix registration reminders (T-7 / T-1 / event day). */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
  const result = await processDueEventRegistrationReminders({ dryRun });
  return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
}
