/**
 * After Factory production reaches BUILDING, run identity gate + concept previews once.
 * Idempotent per experience_concepts artifact version. Never auto-publishes.
 */
import { appendProjectContextOutput, projectContextFromProject } from '@/lib/factory-project-context';
import {
  evaluateIdentityGate,
  readLatestIdentityGateOutput,
  type IdentityGateResult,
} from '@/lib/factory-identity-gate';
import {
  generateAndPersistConceptPreviews,
  listConceptPreviewsFromContext,
  readExperienceConceptsArtifact,
  type ConceptPreviewsPayload,
} from '@/lib/factory-concept-previews';
import { getFactoryProject, type FactoryProject } from '@/lib/factory-project-store';

export const POST_BUILD_CONCEPTS_WORKER = 'post-build-concepts';
export const IDENTITY_GATE_WORKER = 'identity-gate';

export type PostBuildConceptsResult =
  | {
      ok: true;
      skipped: boolean;
      reason: string;
      project: FactoryProject;
      previews: ConceptPreviewsPayload | null;
      identity: IdentityGateResult;
    }
  | {
      ok: false;
      blocked: boolean;
      error: string;
      project: FactoryProject | null;
      identity?: IdentityGateResult;
      previews?: ConceptPreviewsPayload | null;
    };

export type LaunchConceptStatus = {
  hasExperienceConcepts: boolean;
  conceptsArtifactId: string | null;
  identityBlocked: boolean;
  identity: Record<string, unknown> | null;
  conceptPackReady: boolean;
  conceptPackFailed: boolean;
  conceptPackError: string | null;
  conceptUrls: Array<{
    conceptId: string;
    name: string;
    websitePreviewPath: string;
    portalPreviewPath: string;
  }>;
  conceptsReviewPath: string | null;
  statusLabel: string;
  inProgress: boolean;
  readyForConceptReview: boolean;
};

function conceptsArtifactId(project: FactoryProject): string | null {
  if (!project.context) return null;
  const context = projectContextFromProject(project);
  return readExperienceConceptsArtifact(context)?.id || null;
}

function alreadyGeneratedForBuild(
  project: FactoryProject,
  conceptsId: string,
): ConceptPreviewsPayload | null {
  if (!project.context) return null;
  const context = projectContextFromProject(project);
  const existing = listConceptPreviewsFromContext(context);
  if (!existing?.previews?.length) return null;
  const tiedTo = String(existing.sourceConceptsArtifactId || '');
  if (tiedTo && tiedTo === conceptsId) return existing;
  // Legacy payloads without tie: treat as done if previews exist for current build.
  if (!tiedTo) return existing;
  return null;
}

function readLatestPostBuildOutput(
  project: FactoryProject,
): Record<string, unknown> | null {
  const outputs = [...(project.context?.outputs || [])]
    .filter((o) => o.worker === POST_BUILD_CONCEPTS_WORKER && o.kind === 'production')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const last = outputs[outputs.length - 1];
  return last?.payload && typeof last.payload === 'object'
    ? (last.payload as Record<string, unknown>)
    : null;
}

/**
 * Plain-language launch status for Quick Launch / project poll.
 */
export function buildLaunchConceptStatus(project: FactoryProject): LaunchConceptStatus {
  const conceptsId = conceptsArtifactId(project);
  const context = project.context ? projectContextFromProject(project) : null;
  const identityOut = readLatestIdentityGateOutput(context);
  const identityBlocked = Boolean(identityOut && identityOut.ok === false);
  const postBuild = readLatestPostBuildOutput(project);
  const previews = context ? listConceptPreviewsFromContext(context) : null;
  const conceptUrls =
    previews?.previews.map((p) => ({
      conceptId: p.conceptId,
      name: p.name,
      websitePreviewPath: p.websitePreviewPath,
      portalPreviewPath: p.portalPreviewPath,
    })) || [];
  const conceptPackReady = conceptUrls.length > 0;
  const conceptPackFailed = Boolean(postBuild && postBuild.ok === false);
  const conceptPackError =
    typeof postBuild?.error === 'string' ? postBuild.error : null;

  let statusLabel = 'Working…';
  let inProgress = true;
  let readyForConceptReview = false;

  if (project.pipelineStatus === 'FAILED' || project.pipelineStatus === 'CANCELLED') {
    statusLabel = project.pipelineStatus === 'FAILED' ? 'Needs attention' : 'Cancelled';
    inProgress = false;
  } else if (identityBlocked) {
    statusLabel = 'Stopped — identity needs clarification';
    inProgress = false;
  } else if (conceptPackReady) {
    statusLabel = 'Ready for concept review';
    inProgress = false;
    readyForConceptReview = true;
  } else if (conceptsId && !conceptPackReady) {
    statusLabel = conceptPackFailed
      ? 'Concept prep failed — you can retry'
      : 'Preparing concept previews…';
    inProgress = !conceptPackFailed;
  } else if (project.pipelineStatus === 'BUILDING') {
    statusLabel = 'Build complete — finishing concept pack…';
    inProgress = true;
  }

  return {
    hasExperienceConcepts: Boolean(conceptsId),
    conceptsArtifactId: conceptsId,
    identityBlocked,
    identity: identityOut,
    conceptPackReady,
    conceptPackFailed,
    conceptPackError,
    conceptUrls,
    conceptsReviewPath: conceptPackReady
      ? `/admin/ea-factory/concepts/${encodeURIComponent(project.id)}`
      : null,
    statusLabel,
    inProgress,
    readyForConceptReview,
  };
}

/**
 * True when idle orchestrator should attempt post-build concept pack.
 */
export function shouldRunPostBuildConceptPack(project: FactoryProject): boolean {
  if (project.pipelineStatus === 'FAILED' || project.pipelineStatus === 'CANCELLED') {
    return false;
  }
  const conceptsId = conceptsArtifactId(project);
  if (!conceptsId) return false;
  if (alreadyGeneratedForBuild(project, conceptsId)) return false;
  const identityOut = readLatestIdentityGateOutput(
    project.context ? projectContextFromProject(project) : null,
  );
  // If already blocked and no new detail, skip automatic retries (admin resume uses force).
  if (identityOut && identityOut.ok === false) return false;
  const postBuild = readLatestPostBuildOutput(project);
  // Do not auto-loop failed generations — admin retries via force.
  if (
    postBuild &&
    postBuild.ok === false &&
    String(postBuild.sourceConceptsArtifactId || '') === conceptsId
  ) {
    return false;
  }
  return true;
}

/**
 * Idempotent post-build step: identity gate → concept previews.
 */
export async function runPostBuildConceptPack(
  projectId: string,
  options?: { force?: boolean },
): Promise<PostBuildConceptsResult> {
  const project = await getFactoryProject(projectId);
  if (!project) {
    return { ok: false, blocked: false, error: 'Factory project not found.', project: null };
  }

  if (project.pipelineStatus === 'FAILED' || project.pipelineStatus === 'CANCELLED') {
    return {
      ok: false,
      blocked: false,
      error: `Project is ${project.pipelineStatus}; concept pack will not run.`,
      project,
    };
  }

  const conceptsIdEarly = conceptsArtifactId(project);
  if (!conceptsIdEarly) {
    return {
      ok: false,
      blocked: false,
      error: 'Production has not produced experience_concepts yet.',
      project,
    };
  }

  const identity = evaluateIdentityGate(project);
  await appendProjectContextOutput(projectId, {
    kind: 'research',
    worker: IDENTITY_GATE_WORKER,
    payload: {
      ok: identity.ok,
      code: identity.ok ? 'passed' : identity.code,
      confidence: identity.confidence,
      resolvedName: identity.resolvedName,
      reason: identity.reason,
      sources: identity.sources,
      claims: identity.claims,
      candidates: identity.ok ? [identity.resolvedName] : identity.candidates,
      resumeHint: identity.ok ? undefined : identity.resumeHint,
      evaluatedAt: new Date().toISOString(),
    },
    detail: identity.ok ? 'Identity gate passed' : `Identity gate blocked: ${identity.code}`,
  });

  if (!identity.ok) {
    const refreshed = await getFactoryProject(projectId);
    return {
      ok: false,
      blocked: true,
      error: identity.reason,
      project: refreshed,
      identity,
      previews: refreshed?.context
        ? listConceptPreviewsFromContext(projectContextFromProject(refreshed))
        : null,
    };
  }

  const latest = (await getFactoryProject(projectId)) || project;
  const conceptsId = conceptsArtifactId(latest) || conceptsIdEarly;

  if (!options?.force) {
    const existing = alreadyGeneratedForBuild(latest, conceptsId);
    if (existing) {
      return {
        ok: true,
        skipped: true,
        reason: 'Concept previews already generated for this build version.',
        project: latest,
        previews: existing,
        identity,
      };
    }
  }

  const generated = await generateAndPersistConceptPreviews(projectId, {
    sourceConceptsArtifactId: conceptsId,
  });
  if (!generated.ok) {
    await appendProjectContextOutput(projectId, {
      kind: 'production',
      worker: POST_BUILD_CONCEPTS_WORKER,
      payload: {
        ok: false,
        error: generated.error,
        sourceConceptsArtifactId: conceptsId,
        at: new Date().toISOString(),
      },
      detail: `Concept pack failed: ${generated.error}`,
    });
    return {
      ok: false,
      blocked: false,
      error: generated.error,
      project: await getFactoryProject(projectId),
      identity,
    };
  }

  await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: POST_BUILD_CONCEPTS_WORKER,
    payload: {
      ok: true,
      skipped: false,
      sourceConceptsArtifactId: conceptsId,
      previewCount: generated.payload.previews.length,
      conceptUrls: generated.payload.previews.map((p) => ({
        conceptId: p.conceptId,
        name: p.name,
        websitePreviewPath: p.websitePreviewPath,
        portalPreviewPath: p.portalPreviewPath,
      })),
      at: new Date().toISOString(),
    },
    detail: `Concept pack ready · ${generated.payload.previews.length} previews`,
  });

  return {
    ok: true,
    skipped: false,
    reason: 'Concept previews generated for administrator review.',
    project: generated.project,
    previews: generated.payload,
    identity,
  };
}
