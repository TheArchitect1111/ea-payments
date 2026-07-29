import { NextRequest, NextResponse } from 'next/server';
import { appendArtifacts } from '@/lib/factory-artifact';
import { appendProjectContextOutput } from '@/lib/factory-project-context';
import {
  generateAndPersistConceptPreviews,
  CONCEPT_PREVIEWS_WORKER,
} from '@/lib/factory-concept-previews';
import {
  CONTENT_PACKAGE_WORKER,
  type ContentPackage,
} from '@/lib/factory-content-package';
import type { FactoryExperienceConcept } from '@/lib/factory-concept-to-director';
import { runPostBuildConceptPack } from '@/lib/factory-post-build-concepts';
import { getFactoryProject, saveFactoryProject } from '@/lib/factory-project-store';
import { buildQuickLaunchReview } from '@/lib/factory-quick-launch-review';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

type PreviewRecoverBootstrap = {
  client: string;
  goal: string;
  deliverable?: string;
  industry?: string;
  notes?: string;
  url?: string;
  concepts: FactoryExperienceConcept[];
  recommendedConceptId?: string;
  contentPackage: ContentPackage;
};

/**
 * Preview-only recovery: force concept pack for any projectId.
 * Optional `bootstrap` creates/updates a project from research payload (no subject hard-coding).
 * Auth: Bearer PREVIEW_RECOVER_TOKEN or VERCEL_GIT_COMMIT_SHA. Never on Production.
 */
export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 404 });
  }

  const expected = (
    process.env.PREVIEW_RECOVER_TOKEN ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    ''
  ).trim();
  if (!expected) {
    return NextResponse.json({ error: 'Preview recover auth is not configured.' }, { status: 503 });
  }

  const auth = req.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!bearer || bearer !== expected) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: {
    projectId?: string;
    distinguishingDetail?: string;
    bootstrap?: PreviewRecoverBootstrap;
    composeOnly?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const projectId = String(body.projectId || '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  let before = await getFactoryProject(projectId);

  if (!before && body.bootstrap) {
    const boot = body.bootstrap;
    if (!boot.client?.trim() || !Array.isArray(boot.concepts) || boot.concepts.length < 1) {
      return NextResponse.json(
        { error: 'bootstrap requires client and at least one concept.' },
        { status: 400 },
      );
    }
    if (!boot.contentPackage || boot.contentPackage.schemaVersion !== 1) {
      return NextResponse.json(
        { error: 'bootstrap requires a schemaVersion 1 contentPackage.' },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const notes = [boot.notes?.trim(), body.distinguishingDetail?.trim()
      ? `Distinguishing detail: ${body.distinguishingDetail.trim()}`
      : '']
      .filter(Boolean)
      .join('\n');
    const pack: ContentPackage = {
      ...boot.contentPackage,
      projectId,
      generatedAt: boot.contentPackage.generatedAt || now,
    };
    const created = await saveFactoryProject({
      version: 1,
      id: projectId,
      client: boot.client.trim(),
      goal: boot.goal?.trim() || 'Website + portal',
      deliverable: boot.deliverable || 'website',
      industry: boot.industry || '',
      notes,
      url: boot.url || '',
      attachments: [],
      source: 'admin',
      pipelineStatus: 'UNDER_REVIEW',
      createdAt: now,
      updatedAt: now,
      activity: [],
      context: {
        schemaVersion: 1,
        projectId,
        seed: {
          client: boot.client.trim(),
          goal: boot.goal?.trim() || 'Website + portal',
          deliverable: boot.deliverable || 'website',
          industry: boot.industry || '',
          notes,
          url: boot.url || '',
          attachments: [],
          source: 'admin',
        },
        pipelineStatus: 'UNDER_REVIEW',
        outputs: [],
        artifacts: [],
        createdAt: now,
        updatedAt: now,
      },
    });
    if (!created.ok) {
      return NextResponse.json(
        { ok: false, error: created.error || 'Failed to bootstrap project.' },
        { status: 500 },
      );
    }
    await appendArtifacts(projectId, [
      {
        kind: 'experience_concepts',
        providerId: 'preview-recover-bootstrap',
        provenance: {
          capabilityId: 'preview-recover',
          sourceType: 'preview_bootstrap',
        },
        data: {
          concepts: boot.concepts,
          recommendedConceptId: boot.recommendedConceptId || boot.concepts[0]?.id || null,
          selectedConceptId: null,
          selectionStatus: 'awaiting_review',
        },
      },
    ]);
    await appendProjectContextOutput(projectId, {
      kind: 'production',
      worker: CONTENT_PACKAGE_WORKER,
      payload: pack as unknown as Record<string, unknown>,
      detail: 'Bootstrap content package',
    });
    before = await getFactoryProject(projectId);
  }

  if (!before) {
    return NextResponse.json({ error: 'Factory project not found.' }, { status: 404 });
  }

  const detailFromBody = String(body.distinguishingDetail || '').trim();
  const detail = detailFromBody;
  if (detail && !new RegExp(detail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(before.notes || '')) {
    const noteLine = `Distinguishing detail: ${detail}`;
    const nextNotes = [before.notes?.trim(), noteLine].filter(Boolean).join('\n');
    const updated = {
      ...before,
      notes: nextNotes,
      updatedAt: new Date().toISOString(),
      context: before.context
        ? {
            ...before.context,
            seed: before.context.seed
              ? { ...before.context.seed, notes: nextNotes }
              : before.context.seed,
            updatedAt: new Date().toISOString(),
          }
        : before.context,
    };
    await saveFactoryProject(updated);
  }

  // Recover retries accumulate outputs/artifacts — prune before force pack so Airtable can save.
  const current = (await getFactoryProject(projectId)) || before;
  if (current.context) {
    const keepArtifactKinds = new Set([
      'website',
      'branding',
      'organization_profile',
      'prospect_profile',
      'programs',
      'experience_concepts',
      'creative_direction',
      'subject_knowledge_pack',
      'media_brand_pack',
      'content_creative_pack',
      'experience_manifest',
    ]);
    const artifacts = (current.context.artifacts || [])
      .filter((a) => keepArtifactKinds.has(String(a.kind)))
      .slice(-24);
    const outputs = (current.context.outputs || []).slice(-24);
    const pruned = {
      ...current,
      context: {
        ...current.context,
        artifacts,
        outputs,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    const savedPrune = await saveFactoryProject(pruned);
    if (!savedPrune.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Could not prune project context before recover: ${savedPrune.error || 'save failed'}`,
        },
        { status: 500 },
      );
    }
  }

  // Bootstrap / composeOnly: recompose through universal pipeline without full ECE rebuild.
  if (body.bootstrap || body.composeOnly) {
    const composed = await generateAndPersistConceptPreviews(projectId);
    const after = (await getFactoryProject(projectId)) || before;
    const review = await buildQuickLaunchReview(after, { verifyPreviews: true });
    if (!composed.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: composed.error,
          qualityBlocked: review.qualityBlocked,
          qualityReasons: review.qualityReasons,
        },
        { status: 400 },
      );
    }
    return NextResponse.json({
      ok: true,
      mode: body.bootstrap ? 'bootstrap-compose' : 'compose-only',
      worker: CONCEPT_PREVIEWS_WORKER,
      client: after.client,
      qualityBlocked: review.qualityBlocked,
      qualityReasons: review.qualityReasons,
      concepts: review.concepts.map((c) => ({
        conceptId: c.conceptId,
        name: c.name,
        websitePreviewPath: c.websitePreviewPath,
        portalPreviewPath: c.portalPreviewPath,
        websiteVerified: c.websiteVerified,
        portalVerified: c.portalVerified,
      })),
    });
  }

  const result = await runPostBuildConceptPack(projectId, { force: true });
  const after = (await getFactoryProject(projectId)) || before;
  const review = await buildQuickLaunchReview(after, { verifyPreviews: true });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        blocked: result.blocked,
        error: result.error,
        qualityBlocked: review.qualityBlocked,
        qualityReasons: review.qualityReasons,
      },
      { status: result.blocked ? 409 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    skipped: result.skipped,
    client: after.client,
    qualityBlocked: review.qualityBlocked,
    qualityReasons: review.qualityReasons,
    concepts: review.concepts.map((c) => ({
      conceptId: c.conceptId,
      name: c.name,
      websitePreviewPath: c.websitePreviewPath,
      portalPreviewPath: c.portalPreviewPath,
      websiteVerified: c.websiteVerified,
      portalVerified: c.portalVerified,
    })),
  });
}
