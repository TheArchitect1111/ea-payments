import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { canRestart, getProject, transitionFactoryProject } from '@/lib/factory-project';
import { enqueueFactoryProject, scheduleFactoryGenerateJob } from '@/lib/factory-queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const project = await getProject(id.trim());
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  if (!canRestart(project)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Cannot restart project in status ${project.pipelineStatus}.`,
      },
      { status: 409 },
    );
  }

  await transitionFactoryProject(project.id, 'CREATED', 'launcher', 'Restart requested');
  const queued = await enqueueFactoryProject(project.id);
  if (!queued) {
    return NextResponse.json({ ok: false, error: 'Failed to re-queue project.' }, { status: 500 });
  }
  scheduleFactoryGenerateJob(project.id);

  return NextResponse.json({
    ok: true,
    projectId: queued.id,
    status: queued.pipelineStatus,
    timestamp: queued.updatedAt,
  });
}
