import { NextRequest, NextResponse } from 'next/server';
import { drainFactoryQueue } from '@/lib/factory-queue';
import { factoryQueueHealth, listFactoryProjects } from '@/lib/factory-project-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

/** Vercel Cron — drain stuck Factory QUEUED projects. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Safety net every few minutes — picks up projects if a background chain was interrupted.
  const result = await drainFactoryQueue(10);
  const health = factoryQueueHealth(await listFactoryProjects());

  return NextResponse.json({
    ok: true,
    ...result,
    health,
    at: new Date().toISOString(),
  });
}
