import { NextResponse } from 'next/server';
import { FACTORY_WORKERS } from '@/lib/factory-workers';
import { factoryQueueHealth, listFactoryProjects } from '@/lib/factory-project-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const projects = await listFactoryProjects();
  const health = factoryQueueHealth(projects);
  const oldestAgeMs = health.oldestQueuedAt
    ? Date.now() - new Date(health.oldestQueuedAt).getTime()
    : null;

  return NextResponse.json({
    ok: health.queued < 25,
    ...health,
    oldestQueuedAgeMs: oldestAgeMs,
    projectCount: projects.length,
    workers: FACTORY_WORKERS.map((w) => ({
      id: w.id,
      label: w.label,
      phase: w.phase,
      implemented: w.implemented,
    })),
    cron: {
      path: '/api/cron/factory-queue',
      secretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    },
  });
}
