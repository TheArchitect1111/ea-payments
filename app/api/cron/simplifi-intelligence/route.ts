import { NextRequest, NextResponse } from 'next/server';
import { runIntelligenceWorkflow } from '@/lib/simplifi-os';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

/**
 * Thin cron trigger — durable business process is runIntelligenceWorkflow().
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const portalSlug = request.nextUrl.searchParams.get('portal') ?? undefined;
  const force = request.nextUrl.searchParams.get('force') === '1';
  const result = await runIntelligenceWorkflow({ portalSlug, force });

  return NextResponse.json({ ok: result.ok, ...result });
}
