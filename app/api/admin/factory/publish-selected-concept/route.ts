import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { publishSelectedFactoryConcept } from '@/lib/factory-publish-selected-concept';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST — Session 3 wire: selected concept → portal chassis + draft site (+ live if ED + unquarantined).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    projectId?: string;
    portalSlug?: string;
    activatePortal?: boolean;
    forceWebsite?: boolean;
    saveDraft?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const projectId = String(body.projectId || '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  const result = await publishSelectedFactoryConcept({
    projectId,
    portalSlug: body.portalSlug?.trim() || undefined,
    activatePortal: body.activatePortal !== false,
    forceWebsite: body.forceWebsite !== false,
    saveDraft: body.saveDraft !== false,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error || 'Wire selected concept failed.',
        portalSlug: result.portalSlug,
        selectedConceptId: result.selectedConceptId,
        directorGate: result.directorGate,
        directorReview: result.directorReview,
        website: result.website,
        portal: result.portal,
        surfaces: result.surfaces,
      },
      {
        status:
          result.directorGate && !result.directorGate.ok
            ? 403
            : /select|selection|awaiting_review/i.test(result.error || '')
              ? 400
              : 500,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    projectId,
    selectedConceptId: result.selectedConceptId,
    portalSlug: result.portalSlug,
    organizationId: result.organizationId,
    websiteStatus: result.websiteStatus,
    websiteUrl: result.website?.siteUrl || result.surfaces?.siteUrl,
    previewPath: result.website?.previewPath || result.surfaces?.draftPreviewPath,
    portal: result.portal,
    surfaces: result.surfaces,
    directorReview: result.directorReview,
  });
}
