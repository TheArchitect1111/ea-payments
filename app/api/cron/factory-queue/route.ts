import { NextRequest, NextResponse } from 'next/server';
import { drainFactoryQueueDurably } from '@/lib/factory-durable-drain';
import { factoryQueueHealth, listFactoryProjects } from '@/lib/factory-project-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

/** Vercel Cron — durable drain for interrupted Factory work. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await drainFactoryQueueDurably(10);
  const health = factoryQueueHealth(await listFactoryProjects());

  return NextResponse.json({
    ok: result.deadLettered === 0,
    ...result,
    health,
    at: new Date().toISOString(),
  });
}
