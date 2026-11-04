import { NextRequest } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { getFactoryProject, saveFactoryProject } from '@/lib/factory-project-store';
import { requireSameOrigin } from '@/lib/bricks/access';
import { scheduleFactoryGenerateJob } from '@/lib/factory-queue';
import { ACCEPTANCE_CHECKS, ScreenshotBuildInput } from '@/lib/factory-screenshot-build';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFactoryApiAccess(request);
  if (!access.ok) return access.response;
  const { id } = await params;
  const project = await getFactoryProject(id);
  if (project?.buildMode !== 'screenshot') return Response.json({ error: 'Screenshot project not found' }, { status: 404 });
  return Response.json({ ok: true, result: project.screenshotResult || null,
    requiredChecks: ACCEPTANCE_CHECKS, productionVerified: false }, { headers: { 'cache-control': 'private, no-store' } });
}

/** Explicit private retry/configuration only; never publishes or changes tenant installations. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFactoryApiAccess(request);
  if (!access.ok) return access.response;
  try {
    requireSameOrigin(request);
    const { id } = await params;
    const project = await getFactoryProject(id);
    if (project?.buildMode !== 'screenshot') return Response.json({ error: 'Screenshot project not found' }, { status: 404 });
    if (project.pipelineStatus === 'CANCELLED') return Response.json({ error: 'Project cancelled' }, { status: 409 });
    const body = await request.json();
    const config = body.screenshotBuild ? ScreenshotBuildInput.parse(body.screenshotBuild) : project.screenshotBuild;
    if (!config || config.pages.some(p => project.attachments[p.attachmentIndex]?.type !== 'image')) throw new Error('Missing image');
    const saved = await saveFactoryProject({ ...project, screenshotBuild: config, screenshotResult: undefined,
      screenshotRetryAttempts: 0,
      pipelineStatus: 'QUEUED', error: undefined, updatedAt: new Date().toISOString() });
    if (!saved.ok) throw new Error('Retry persistence failed');
    scheduleFactoryGenerateJob(id);
    return Response.json({ ok: true, status: 'QUEUED' }, { status: 202 });
  } catch {
    return Response.json({ error: 'Could not queue private retry. Check configuration and storage.' }, { status: 400 });
  }
}
