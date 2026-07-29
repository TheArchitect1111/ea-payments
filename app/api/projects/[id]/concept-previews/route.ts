import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { mergeDistinguishingDetail } from '@/lib/factory-identity-gate';
import {
  buildLaunchConceptStatus,
  runPostBuildConceptPack,
} from '@/lib/factory-post-build-concepts';
import { getFactoryProject, saveFactoryProject } from '@/lib/factory-project-store';
import { getProject } from '@/lib/factory-project';
import {
  extractFirstUrlFromText,
  extractUrlFromLaunchNotes,
  normalizeLaunchUrl,
} from '@/lib/factory-url-normalize.mjs';
import { scheduleFactoryGenerateJob } from '@/lib/factory-queue';
import { setProjectContextStatus } from '@/lib/factory-project-context';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/**
 * Retry concept pack and/or resume after identity clarification.
 * Body: { force?: boolean, distinguishingDetail?: string, url?: string }
 * Does not publish.
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
  const urlFromBody = normalizeLaunchUrl(body.url);
  const urlFromProject =
    normalizeLaunchUrl(project.url) ||
    extractUrlFromLaunchNotes(project.notes) ||
    extractFirstUrlFromText(detail) ||
    extractFirstUrlFromText(project.notes);
  const resolvedUrl = urlFromBody || urlFromProject;

  let shouldRerunResearch = false;
  if (detail || resolvedUrl || urlFromBody) {
    const at = new Date().toISOString();
    const nextNotes = mergeDistinguishingDetail(
      project.notes,
      detail || parseExistingDetail(project.notes) || project.client,
      resolvedUrl || undefined,
    );
    const priorUrl = normalizeLaunchUrl(project.url) || normalizeLaunchUrl(project.context?.seed?.url);
    const next = {
      ...project,
      notes: nextNotes,
      url: resolvedUrl || project.url,
      updatedAt: at,
      activity: [
        ...(project.activity || []),
        {
          at,
          from: project.pipelineStatus,
          to: project.pipelineStatus,
          worker: 'identity-resume',
          detail: resolvedUrl
            ? `Normalized official website ${resolvedUrl}`
            : 'Administrator clarified subject',
        },
      ],
      context: project.context
        ? {
            ...project.context,
            seed: {
              ...project.context.seed,
              notes: nextNotes,
              url: resolvedUrl || project.context.seed?.url,
            },
            updatedAt: at,
          }
        : project.context,
    };
    const saved = await saveFactoryProject(next);
    if (!saved.ok) {
      return NextResponse.json(
        { ok: false, error: saved.error || 'Failed to save identifying detail.' },
        { status: 500 },
      );
    }
    project = next;
    // Re-run research when we newly normalize a URL the pipeline never fetched.
    shouldRerunResearch = Boolean(resolvedUrl && resolvedUrl !== priorUrl) || Boolean(resolvedUrl && body.force);
  }

  // Auto-heal stuck launches that already had a bare domain in notes/url.
  if (!shouldRerunResearch && resolvedUrl && body.force !== false) {
    const hasWebsite = (project.context?.artifacts || []).some((a) => a.kind === 'website');
    if (!hasWebsite) {
      shouldRerunResearch = true;
    }
  }

  if (shouldRerunResearch && resolvedUrl) {
    await setProjectContextStatus(
      projectId,
      'RESEARCHING',
      'identity-resume',
      `Researching normalized website ${resolvedUrl}`,
    );
    scheduleFactoryGenerateJob(projectId);
    const latest = await getProject(projectId);
    return NextResponse.json({
      ok: true,
      resumed: true,
      reason: 'Official website normalized. Research restarted automatically.',
      launch: latest ? buildLaunchConceptStatus(latest) : null,
    });
  }

  const result = await runPostBuildConceptPack(projectId, {
    force: Boolean(body.force) || Boolean(detail) || Boolean(urlFromBody),
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

function parseExistingDetail(notes: string | undefined): string | undefined {
  if (!notes) return undefined;
  const match = notes.match(/Distinguishing detail:\s*(.+)/i);
  return match?.[1]?.split('\n')[0]?.trim() || undefined;
}
