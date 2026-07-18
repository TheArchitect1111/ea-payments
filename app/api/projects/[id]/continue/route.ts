import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { setProjectContextStatus } from '@/lib/factory-project-context';
import { canContinueFactoryProject, getProject } from '@/lib/factory-project';
import { scheduleFactoryGenerateJob } from '@/lib/factory-queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

/**
 * Resume a mid-pipeline Factory project.
 * Returns quickly — heavy work runs in after() so phone UI does not hang.
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

  let status = project.pipelineStatus;

  // Visible progress right away when stuck after intake.
  if (status === 'INTAKE_COMPLETE') {
    const moved = await setProjectContextStatus(
      projectId,
      'RESEARCHING',
      'continue',
      'Continue requested — starting research',
    );
    if (moved?.project) {
      status = moved.project.pipelineStatus;
    }
  }

  scheduleFactoryGenerateJob(projectId);

  const latest = (await getProject(projectId)) ?? project;

  return NextResponse.json({
    ok: true,
    projectId,
    status: latest.pipelineStatus || status,
    timestamp: latest.updatedAt,
    message: 'Factory continue started. Tap Refresh in a few seconds.',
  });
}
