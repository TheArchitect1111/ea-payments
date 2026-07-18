import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { createFactoryProject, type LaunchProjectInput } from '@/lib/factory-project';
import { launchFactoryProjectFlow } from '@/lib/factory-queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * EA Factory Launcher — accept launch request, create project, queue GenerateWorker.
 */
export async function POST(request: NextRequest) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = checkRateLimit(`factory-launch:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Launch rate limit exceeded. Try again later.' },
      { status: 429 },
    );
  }

  let body: LaunchProjectInput;
  try {
    body = (await request.json()) as LaunchProjectInput;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const created = await createFactoryProject({
    ...body,
    source: auth.via === 'admin' ? 'admin' : 'chatgpt',
  });

  if (!created.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing required launch fields.',
        missing: created.missing,
        correction: created.correction,
      },
      { status: 400 },
    );
  }

  const queued = await launchFactoryProjectFlow(created.project.id);
  const project = queued || created.project;

  return NextResponse.json({
    ok: true,
    projectId: project.id,
    status: project.pipelineStatus,
    timestamp: project.createdAt,
    client: project.client,
    goal: project.goal,
    deliverable: project.deliverable,
    message: 'Project created and queued. Poll GET /api/projects/{id} for status.',
  });
}
