import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import {
  generateAndPersistConceptPreviews,
  loadConceptPreviewsPayload,
} from '@/lib/factory-concept-previews';

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
  if (!payload) {
    return NextResponse.json({
      ok: true,
      generated: false,
      previews: null,
      message: 'No concept previews yet. POST to generate.',
    });
  }

  return NextResponse.json({
    ok: true,
    generated: true,
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
 * POST — compose real directed website + portal draft previews for all concepts.
 * Does not publish.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { projectId?: string; portalSlug?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const projectId = String(body.projectId || '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  const result = await generateAndPersistConceptPreviews(projectId, {
    portalSlug: body.portalSlug?.trim() || undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    generatedAt: result.payload.generatedAt,
    portalSlug: result.payload.portalSlug,
    selectionStatus: result.payload.selectionStatus,
    recommendedConceptId: result.payload.recommendedConceptId,
    selectedConceptId: result.payload.selectedConceptId,
    previews: result.payload.previews.map((p) => ({
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
