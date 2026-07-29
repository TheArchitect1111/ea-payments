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
  plainLanguageStage: string;
  progressHint: string;
  inProgress: boolean;
  readyForConceptReview: boolean;
  needsAutomaticNudge: boolean;
  stageDurationsMs: Record<string, number>;
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

function stageDurationsFromActivity(project: FactoryProject): Record<string, number> {
  const durations: Record<string, number> = {};
  const activity = [...(project.activity || [])].sort((a, b) => a.at.localeCompare(b.at));
  for (let i = 0; i < activity.length - 1; i++) {
    const cur = activity[i]!;
    const next = activity[i + 1]!;
    const start = Date.parse(cur.at);
    const end = Date.parse(next.at);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    const key = String(cur.to || cur.worker || 'step');
    durations[key] = (durations[key] || 0) + (end - start);
  }
  return durations;
}

function plainStageForProject(
  project: FactoryProject,
  launchReady: boolean,
  identityBlocked: boolean,
  hasConceptsArtifact: boolean,
): { stage: string; hint: string } {
  if (project.pipelineStatus === 'FAILED') {
    return {
      stage: 'Needs attention',
      hint: 'Automatic recovery stopped. Open recovery options below.',
    };
  }
  if (project.pipelineStatus === 'CANCELLED') {
    return { stage: 'Cancelled', hint: 'This launch was cancelled.' };
  }
  if (identityBlocked) {
    return {
      stage: 'Finding the right person or organization',
      hint: 'We need one clearer match before concepts can be prepared.',
    };
  }
  if (launchReady) {
    return {
      stage: 'Ready for review',
      hint: 'Research package and concepts are ready. Choose a direction.',
    };
  }
  // Concepts exist but previews not durable/ready yet
  if (hasConceptsArtifact) {
    return {
      stage: 'Checking website and portal previews',
      hint: 'Confirming each sample is ready for review.',
    };
  }
  switch (project.pipelineStatus) {
    case 'CREATED':
    case 'QUEUED':
    case 'INTAKE':
    case 'INTAKE_COMPLETE':
      return {
        stage: 'Finding the right person or organization',
        hint: 'Usually under a minute. Stay on this screen.',
      };
    case 'RESEARCHING':
      return {
        stage: 'Researching their story',
        hint: 'Usually 1–3 minutes depending on available sources.',
      };
    case 'DISCOVERING':
      return {
        stage: 'Gathering trusted information and media',
        hint: 'Collecting proof signals, programs, and brand cues.',
      };
    case 'PLANNING':
      return {
        stage: 'Creating the research package',
        hint: 'Shaping story strategy, creative brief, and content.',
      };
    case 'BUILDING':
    case 'GENERATING':
      return {
        stage: 'Building three custom concepts',
        hint: 'Creating three distinct website and portal directions.',
      };
    default:
      return {
        stage: 'Checking website and portal previews',
        hint: 'Confirming each sample is ready for review.',
      };
  }
}

function shouldAllowAutoRetry(project: FactoryProject, conceptsId: string): boolean {
  const fails = [...(project.context?.outputs || [])].filter((o) => {
    if (o.worker !== POST_BUILD_CONCEPTS_WORKER || o.kind !== 'production') return false;
    const payload = o.payload as { ok?: boolean; sourceConceptsArtifactId?: string };
    return (
      payload?.ok === false &&
      String(payload.sourceConceptsArtifactId || '') === conceptsId
    );
  });
  return fails.length < 2;
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
  if (identityOut && identityOut.ok === false) return false;
  if (!shouldAllowAutoRetry(project, conceptsId)) return false;
  return true;
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

  let conceptUrls =
    previews?.previews.map((p) => ({
      conceptId: p.conceptId,
      name: p.name,
      websitePreviewPath: p.websitePreviewPath,
      portalPreviewPath: p.portalPreviewPath,
    })) || [];

  const packOk = Boolean(postBuild && postBuild.ok === true);
  if (!conceptUrls.length && packOk && conceptsId && context) {
    const art = readExperienceConceptsArtifact(context);
    const concepts = Array.isArray(
      (art?.data as { concepts?: { id: string; name?: string }[] })?.concepts,
    )
      ? (art!.data as { concepts: { id: string; name?: string }[] }).concepts
      : [];
    conceptUrls = concepts.map((c) => ({
      conceptId: c.id,
      name: c.name || c.id,
      websitePreviewPath: `/preview/factory/${encodeURIComponent(project.id)}/${encodeURIComponent(c.id)}`,
      portalPreviewPath: `/preview/factory/${encodeURIComponent(project.id)}/${encodeURIComponent(c.id)}/portal`,
    }));
  }

  const conceptPackReady =
    conceptUrls.length > 0 && (Boolean(previews?.previews?.length) || packOk);
  const conceptPackFailed = Boolean(postBuild && postBuild.ok === false);
  const conceptPackError =
    typeof postBuild?.error === 'string' ? postBuild.error : null;

  const plain = plainStageForProject(
    project,
    conceptPackReady,
    identityBlocked,
    Boolean(conceptsId),
  );
  let statusLabel = plain.stage;
  let inProgress = true;
  let readyForConceptReview = false;
  let needsAutomaticNudge = false;

  if (project.pipelineStatus === 'FAILED' || project.pipelineStatus === 'CANCELLED') {
    inProgress = false;
  } else if (identityBlocked) {
    inProgress = false;
    statusLabel = plain.stage;
  } else if (conceptPackReady) {
    statusLabel = 'Ready for review';
    inProgress = false;
    readyForConceptReview = true;
  } else if (conceptsId && !conceptPackReady) {
    statusLabel = 'Checking website and portal previews';
    inProgress = !conceptPackFailed || shouldAllowAutoRetry(project, conceptsId);
    needsAutomaticNudge = shouldRunPostBuildConceptPack(project);
  } else if (
    project.pipelineStatus === 'BUILDING' ||
    project.pipelineStatus === 'QUEUED' ||
    project.pipelineStatus === 'INTAKE' ||
    project.pipelineStatus === 'INTAKE_COMPLETE' ||
    project.pipelineStatus === 'RESEARCHING' ||
    project.pipelineStatus === 'DISCOVERING' ||
    project.pipelineStatus === 'PLANNING' ||
    project.pipelineStatus === 'GENERATING'
  ) {
    inProgress = true;
    needsAutomaticNudge = true;
  }

  return {
    hasExperienceConcepts: Boolean(conceptsId),
    conceptsArtifactId: conceptsId,
    identityBlocked,
    identity: identityOut,
    conceptPackReady,
    conceptPackFailed,
    conceptPackError,
    conceptUrls: conceptPackReady ? conceptUrls : [],
    conceptsReviewPath: conceptPackReady
      ? `/admin/ea-factory/concepts/${encodeURIComponent(project.id)}`
      : null,
    statusLabel,
    plainLanguageStage: plain.stage,
    progressHint: plain.hint,
    inProgress,
    readyForConceptReview,
    needsAutomaticNudge,
    stageDurationsMs: stageDurationsFromActivity(project),
  };
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
