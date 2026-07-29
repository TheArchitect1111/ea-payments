import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { parseFactoryLaunchBody } from '@/lib/factory-launch-request';
import { createFactoryProject, resolveLaunchProjectInput } from '@/lib/factory-project';
import { listFactoryProjects } from '@/lib/factory-project-store';
import { launchFactoryProjectFlow } from '@/lib/factory-queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * EA Factory Launcher — accept launch request, create project, queue GenerateWorker.
 * JSON (ChatGPT) or multipart form (admin phone Launch / Universal Quick Launch).
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

  const parsed = await parseFactoryLaunchBody(request);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const resolved = resolveLaunchProjectInput(parsed.body);
  if (resolved.input?.client && !parsed.forceNew) {
    const recent = await listFactoryProjects();
    const needle = resolved.input.client.trim().toLowerCase();
    const cutoff = Date.now() - DUPLICATE_WINDOW_MS;
    const existing = recent.find((project) => {
      if (project.client.trim().toLowerCase() !== needle) return false;
      const created = Date.parse(project.createdAt);
      return Number.isFinite(created) && created >= cutoff;
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        reused: true,
        projectId: existing.id,
        status: existing.pipelineStatus,
        timestamp: existing.createdAt,
        client: existing.client,
        goal: existing.goal,
        deliverable: existing.deliverable,
        message:
          'Recent project for this name already exists. Reusing it to prevent duplicate launches.',
      });
    }
  }

  const created = await createFactoryProject({
    ...parsed.body,
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
    reused: false,
    projectId: project.id,
    status: project.pipelineStatus,
    timestamp: project.createdAt,
    client: project.client,
    goal: project.goal,
    deliverable: project.deliverable,
    message: 'Project created and queued. Poll GET /api/projects/{id} for status.',
  });
}
