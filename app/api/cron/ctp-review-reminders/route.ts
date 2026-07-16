import { NextRequest, NextResponse } from 'next/server';
import { processDueCtpReviewReminders } from '@/lib/ctp-review-schedule';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

/** Vercel Cron — CTP collaborative review reminders (~24h before). */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processDueCtpReviewReminders();
  return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
}
