import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { parseFactoryLaunchBody } from '@/lib/factory-launch-request';
import { createFactoryProject, resolveLaunchProjectInput } from '@/lib/factory-project';
import { listFactoryProjects, saveFactoryProject } from '@/lib/factory-project-store';
import { launchFactoryProjectFlow } from '@/lib/factory-queue';
import { registerFactoryProjectControlPlane } from '@/lib/control-plane-bridge';

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
  if (resolved.input?.client && (!parsed.forceNew || parsed.body.buildMode === 'screenshot')) {
    const recent = await listFactoryProjects();
    const canonicalName = (name: string) => parsed.body.buildMode === 'screenshot' && /^(ayf|are you fundable)$/i.test(name.trim()) ? 'are you fundable' : name.trim().toLowerCase();
    const needle = canonicalName(resolved.input.client);
    const cutoff = Date.now() - DUPLICATE_WINDOW_MS;
    const existing = recent.find((project) => {
      if (canonicalName(project.client) !== needle) return false;
      if (parsed.body.buildMode === 'screenshot') return true;
      const created = Date.parse(project.createdAt);
      return Number.isFinite(created) && created >= cutoff;
    });
    if (existing) {
      if (parsed.body.buildMode === 'screenshot') {
        if (existing.pipelineStatus === 'CANCELLED') return NextResponse.json({ ok: false,
          error: 'The existing project is cancelled. It was not duplicated or restarted.' }, { status: 409 });
        const bridge = await registerFactoryProjectControlPlane(existing);
        if (!bridge.ok) return NextResponse.json({ ok: false, error: 'Canonical Control Plane registration is required before private execution.' }, { status: 503 });
        const attachments = [...existing.attachments];
        const indexes = (parsed.body.attachments || []).map(attachment => {
          const priorIndex = attachments.findIndex(a => a.url && a.url === attachment.url);
          if (priorIndex >= 0) return priorIndex;
          attachments.push(attachment); return attachments.length - 1;
        });
        if (attachments.length > 1024) return NextResponse.json({ ok: false, error: 'Project attachment limit reached. Existing references were preserved.' }, { status: 400 });
        const config = parsed.body.screenshotBuild!;
        const screenshotBuild = { ...config, pages: config.pages.map(p => ({ ...p, attachmentIndex: indexes[p.attachmentIndex]! })),
          imageBindings: config.imageBindings.map(b => ({ ...b, attachmentIndex: indexes[b.attachmentIndex]! })) };
        const updated = { ...existing, buildMode: 'screenshot' as const, screenshotBuild,
          attachments, screenshotResult: undefined, error: undefined,
          screenshotRetryAttempts: 0,
          pipelineStatus: 'QUEUED' as const, updatedAt: new Date().toISOString() };
        const saved = await saveFactoryProject(updated);
        if (!saved.ok) return NextResponse.json({ ok: false, error: 'Could not save the private build request.' }, { status: 503 });
        await launchFactoryProjectFlow(existing.id);
        return NextResponse.json({ ok: true, reused: true, projectId: existing.id, client: existing.client,
          status: 'QUEUED', message: 'Screenshot build queued on the existing project. No duplicate was created.' });
      }
      const bridge = await registerFactoryProjectControlPlane(existing);
      if (!bridge.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Control Plane registration failed for the existing Factory project.',
            correction:
              'Nothing was duplicated or promoted. Resolve the canonical Control Plane registration, then retry.',
          },
          { status: 503 },
        );
      }
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
    const controlPlaneFailure = created.missing.includes('control-plane');
    return NextResponse.json(
      {
        ok: false,
        error: controlPlaneFailure
          ? 'Control Plane registration required before Factory execution.'
          : 'Missing required launch fields.',
        missing: created.missing,
        correction: created.correction,
      },
      { status: controlPlaneFailure ? 503 : 400 },
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
