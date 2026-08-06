import { NextRequest, NextResponse } from 'next/server';
import { processDueAmplifiPosts } from '@/lib/creative-studio/campaign-scheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processDueAmplifiPosts();
  return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
}
