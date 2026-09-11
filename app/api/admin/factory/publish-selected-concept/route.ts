import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { publishSelectedFactoryConcept } from '@/lib/factory-publish-selected-concept';
import { persistFactoryFulfillment } from '@/lib/factory-fulfillment';
import { getFactoryProject } from '@/lib/factory-project-store';
import {
  getControlPlaneReleaseState,
  registerFactoryWiredControlPlane,
} from '@/lib/control-plane-bridge';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST — selected concept → portal chassis + website + Control Plane + fulfillment proof.
 * Fail closed before public-capable wiring, and never mark a client COMPLETE without
 * one persisted Factory fulfillment record.
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

  const project = await getFactoryProject(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Factory project not found.' }, { status: 404 });
  }

  const releaseState = await getControlPlaneReleaseState(project.client);
  if (!releaseState.ok || !releaseState.ready) {
    return NextResponse.json(
      {
        error: 'Control Plane release gates are not ready for this client.',
        correction:
          'The selected concept and project remain preserved. Resolve the listed Control Plane gates before wiring or public promotion.',
        projectId,
        client: project.client,
        controlPlane: {
          ready: false,
          reasons: releaseState.reasons,
          error: releaseState.error,
          manifestRecordId: releaseState.manifestRecordId,
          governanceRecordId: releaseState.governanceRecordId,
        },
      },
      { status: releaseState.ok ? 409 : 503 },
    );
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

  const bridge = await registerFactoryWiredControlPlane({
    project,
    portalUrl: result.surfaces?.portalHomeUrl,
    productionUrl: result.website?.siteUrl || result.surfaces?.siteUrl,
    websiteStatus: result.websiteStatus,
  });
  if (!bridge.ok) {
    return NextResponse.json(
      {
        error:
          'Factory surfaces were wired, but EA refused to declare the operation complete because Control Plane acceptance registration failed.',
        correction:
          'Preserve the wired surfaces. Resolve Control Plane registration, then rerun verification before public promotion.',
        projectId,
        portalSlug: result.portalSlug,
        websiteStatus: result.websiteStatus,
        website: result.website,
        portal: result.portal,
        surfaces: result.surfaces,
        controlPlaneError: bridge.error,
      },
      { status: 503 },
    );
  }

  let fulfillment;
  try {
    fulfillment = await persistFactoryFulfillment({
      projectId,
      websiteStatus: result.websiteStatus,
      websiteUrl: result.website?.siteUrl || result.surfaces?.siteUrl,
      previewPath: result.website?.previewPath || result.surfaces?.draftPreviewPath,
      portalSlug: result.portalSlug,
      organizationId: result.organizationId,
      portalUrl: result.surfaces?.portalHomeUrl,
      portalLoginUrl: result.surfaces?.portalLoginUrl,
      portalProvisioned: Boolean(result.portal?.ok && result.portal?.portalSlug && result.portal?.orgId),
      loginCtaPresent: Boolean(result.surfaces?.loginCtaPresent),
      memberHomeSaved: Boolean(result.surfaces?.memberHomeSaved),
      directorGateVerified: result.websiteStatus === 'live' ? Boolean(result.directorGate?.ok) : true,
      controlPlane: {
        verified: true,
        manifestRecordId: bridge.manifestRecordId,
        governanceRecordId: bridge.governanceRecordId,
        acceptanceRecordId: bridge.acceptanceRecordId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Client surfaces were wired, but EA refused to mark the Factory project complete because fulfillment proof could not be persisted.',
        correction: 'Preserve the wired surfaces. Rerun fulfillment verification before delivery.',
        projectId,
        portalSlug: result.portalSlug,
        websiteStatus: result.websiteStatus,
        detail: error instanceof Error ? error.message : 'Unknown fulfillment persistence error.',
      },
      { status: 503 },
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
    fulfillment,
    controlPlane: {
      ready: true,
      manifestRecordId: bridge.manifestRecordId,
      governanceRecordId: bridge.governanceRecordId,
      acceptanceRecordId: bridge.acceptanceRecordId,
    },
  });
}