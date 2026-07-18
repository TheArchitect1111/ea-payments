import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { canContinueFactoryProject, getProject } from '@/lib/factory-project';
import { runFactoryOrchestrator } from '@/lib/factory-orchestrator';
import { scheduleFactoryGenerateJob } from '@/lib/factory-queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/**
 * Resume a mid-pipeline Factory project (e.g. stuck at INTAKE_COMPLETE after after() timed out).
 */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const projectId = id.trim();
  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  if (!canContinueFactoryProject(project)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Cannot continue project in status ${project.pipelineStatus}.`,
      },
      { status: 409 },
    );
  }

  // Kick a background pass and also try one synchronous orchestrator run for immediate progress.
  scheduleFactoryGenerateJob(projectId);
  const updated = await runFactoryOrchestrator(projectId);

  return NextResponse.json({
    ok: true,
    projectId,
    status: updated?.pipelineStatus ?? project.pipelineStatus,
    timestamp: updated?.updatedAt ?? project.updatedAt,
    message: 'Factory continue started.',
  });
}
