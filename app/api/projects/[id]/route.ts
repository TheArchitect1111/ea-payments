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

  return NextResponse.json({
    ok: true,
    project,
    statusLabel: factoryFriendlyLabel(project.pipelineStatus),
    stage: factoryFriendlyStage(project.pipelineStatus),
    inProgress: factoryIsInProgress(project.pipelineStatus),
    ready: factoryIsTerminalSuccess(project.pipelineStatus),
    failed: factoryIsTerminalFailure(project.pipelineStatus),
  });
}
