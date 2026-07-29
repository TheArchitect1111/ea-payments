import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { getProject } from '@/lib/factory-project';
import {
  factoryFriendlyLabel,
  factoryFriendlyStage,
  factoryIsInProgress,
  factoryIsTerminalFailure,
  factoryIsTerminalSuccess,
} from '@/lib/factory-status-labels';
import { buildLaunchConceptStatus } from '@/lib/factory-post-build-concepts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const project = await getProject(id.trim());
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  const launch = buildLaunchConceptStatus(project);
  const pipelineInProgress = factoryIsInProgress(project.pipelineStatus);
  const inProgress = launch.identityBlocked
    ? false
    : launch.conceptPackReady
      ? false
      : launch.inProgress || pipelineInProgress;
  const ready =
    launch.readyForConceptReview ||
    (factoryIsTerminalSuccess(project.pipelineStatus) && launch.conceptPackReady);

  return NextResponse.json({
    ok: true,
    project,
    statusLabel: launch.statusLabel || factoryFriendlyLabel(project.pipelineStatus),
    stage: factoryFriendlyStage(project.pipelineStatus),
    inProgress,
    ready,
    failed: factoryIsTerminalFailure(project.pipelineStatus),
    launch,
  });
}
