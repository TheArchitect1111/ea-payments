import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { listProjects } from '@/lib/factory-project';
import {
  factoryFriendlyLabel,
  factoryIsInProgress,
} from '@/lib/factory-status-labels';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const projects = await listProjects();
  return NextResponse.json({
    ok: true,
    count: projects.length,
    projects: projects.map((p) => ({
      id: p.id,
      client: p.client,
      goal: p.goal,
      deliverable: p.deliverable,
      pipelineStatus: p.pipelineStatus,
      statusLabel: factoryFriendlyLabel(p.pipelineStatus),
      inProgress: factoryIsInProgress(p.pipelineStatus),
      source: p.source,
      launchId: p.launchId,
      launchReviewUrl: p.launchReviewUrl,
      url: p.url,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      error: p.error,
    })),
  });
}
