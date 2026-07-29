import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { loadConceptPreviewsPayload } from '@/lib/factory-concept-previews';
import {
  buildLaunchConceptStatus,
  runPostBuildConceptPack,
} from '@/lib/factory-post-build-concepts';
import { getFactoryProject } from '@/lib/factory-project-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** GET — load latest composed concept previews for a Factory project. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const projectId = String(req.nextUrl.searchParams.get('projectId') || '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  const payload = await loadConceptPreviewsPayload(projectId);
  const project = await getFactoryProject(projectId);
  const launch = project ? buildLaunchConceptStatus(project) : null;
  if (!payload) {
    return NextResponse.json({
      ok: true,
      generated: false,
      previews: null,
      launch,
      message: 'No concept previews yet. POST to generate.',
    });
  }

  return NextResponse.json({
    ok: true,
    generated: true,
    launch,
    previews: {
      ...payload,
      // Omit bulky puck payloads from list responses
      previews: payload.previews.map((p) => ({
        conceptId: p.conceptId,
        name: p.name,
        lens: p.lens,
        recommended: p.recommended,
        websitePreviewPath: p.websitePreviewPath,
        portalPreviewPath: p.portalPreviewPath,
        compositionSignature: p.compositionSignature,
        themeId: p.themeId,
        primaryColor: p.primaryColor,
        accentColor: p.accentColor,
        portalShell: p.portalShell,
      })),
    },
  });
}

/**
 * POST — compose directed website + portal draft previews (identity gate first).
 * Does not publish. Idempotent per experience_concepts artifact unless force=true.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { projectId?: string; portalSlug?: string; force?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const projectId = String(body.projectId || '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  const result = await runPostBuildConceptPack(projectId, {
    force: Boolean(body.force),
  });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        blocked: result.blocked,
        identity: result.identity || null,
      },
      { status: result.blocked ? 409 : 400 },
    );
  }

  const payload = result.previews;
  if (!payload) {
    return NextResponse.json({ error: 'Concept previews missing after generate.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    skipped: result.skipped,
    generatedAt: payload.generatedAt,
    portalSlug: payload.portalSlug,
    selectionStatus: payload.selectionStatus,
    recommendedConceptId: payload.recommendedConceptId,
    selectedConceptId: payload.selectedConceptId,
    sourceConceptsArtifactId: payload.sourceConceptsArtifactId,
    previews: payload.previews.map((p) => ({
      conceptId: p.conceptId,
      name: p.name,
      lens: p.lens,
      recommended: p.recommended,
      websitePreviewPath: p.websitePreviewPath,
      portalPreviewPath: p.portalPreviewPath,
      compositionSignature: p.compositionSignature,
      themeId: p.themeId,
    })),
  });
}
