import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { mergeDistinguishingDetail } from '@/lib/factory-identity-gate';
import {
  buildLaunchConceptStatus,
  runPostBuildConceptPack,
} from '@/lib/factory-post-build-concepts';
import { getFactoryProject, saveFactoryProject } from '@/lib/factory-project-store';
import { getProject } from '@/lib/factory-project';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/**
 * Retry concept pack and/or resume after identity clarification.
 * Body: { force?: boolean, distinguishingDetail?: string, url?: string }
 * Does not relaunch the whole Factory pipeline and does not publish.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const projectId = id.trim();
  let body: { force?: boolean; distinguishingDetail?: string; url?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  let project = await getFactoryProject(projectId);
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  const detail = String(body.distinguishingDetail || '').trim();
  const url = String(body.url || '').trim();
  if (detail || url) {
    const at = new Date().toISOString();
    const nextNotes = mergeDistinguishingDetail(project.notes, detail || 'Clarified by administrator', url || undefined);
    const next = {
      ...project,
      notes: nextNotes,
      url: url || project.url,
      updatedAt: at,
      activity: [
        ...(project.activity || []),
        {
          at,
          from: project.pipelineStatus,
          to: project.pipelineStatus,
          worker: 'identity-resume',
          detail: detail
            ? `Administrator added identifying detail for resume`
            : `Administrator added URL for resume`,
        },
      ],
    };
    const saved = await saveFactoryProject(next);
    if (!saved.ok) {
      return NextResponse.json(
        { ok: false, error: saved.error || 'Failed to save identifying detail.' },
        { status: 500 },
      );
    }
    project = next;
  }

  const result = await runPostBuildConceptPack(projectId, {
    force: Boolean(body.force) || Boolean(detail) || Boolean(url),
  });
  const latest = (await getProject(projectId)) || result.project;
  const launch = latest ? buildLaunchConceptStatus(latest) : null;

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        blocked: result.blocked,
        error: result.error,
        launch,
        identity: result.identity || null,
      },
      { status: result.blocked ? 409 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    skipped: result.skipped,
    reason: result.reason,
    launch,
    identity: result.identity,
    previews: result.previews
      ? {
          portalSlug: result.previews.portalSlug,
          selectionStatus: result.previews.selectionStatus,
          previews: result.previews.previews.map((p) => ({
            conceptId: p.conceptId,
            name: p.name,
            websitePreviewPath: p.websitePreviewPath,
            portalPreviewPath: p.portalPreviewPath,
          })),
        }
      : null,
  });
}
