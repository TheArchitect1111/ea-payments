import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { canCancel, getProject, transitionFactoryProject } from '@/lib/factory-project';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const project = await getProject(id.trim());
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  if (!canCancel(project)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Cannot cancel project in status ${project.pipelineStatus}.`,
      },
      { status: 409 },
    );
  }

  const cancelled = await transitionFactoryProject(
    project.id,
    'CANCELLED',
    'launcher',
    'Cancelled by operator',
  );

  return NextResponse.json({
    ok: true,
    projectId: cancelled?.id,
    status: cancelled?.pipelineStatus,
    timestamp: cancelled?.updatedAt,
  });
}
