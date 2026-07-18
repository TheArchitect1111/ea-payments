/**
 * Research capability — provider-based artifact collection (Phase 4).
 * No AI summarization / planning. Orchestrator + registry unchanged.
 */
import { researchCanRun as researchCanRunPure } from '@/lib/factory-capability-gates.mjs';
import type { Capability, CapabilityExecutionResult } from '@/lib/factory-capability';
import { appendArtifacts } from '@/lib/factory-artifact';
import {
  appendProjectContextOutput,
  getLatestProjectContextOutput,
  loadProjectContext,
  setProjectContextStatus,
  type ProjectContext,
} from '@/lib/factory-project-context';
import { getProject } from '@/lib/factory-project';
import { isSyntheticPhotoClient } from '@/lib/factory-research/image-signal';
import { collectResearchArtifacts } from '@/lib/factory-research/run-providers';
import { saveFactoryProject } from '@/lib/factory-project-store';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Rename synthetic photo launches from vision branding (real sit-down name). */
async function applyImageSignalIdentity(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project?.context) return;

  const branding = [...(project.context.artifacts || [])]
    .reverse()
    .find((art) => art.kind === 'branding' && Boolean(art.data?.hasVision));
  if (!branding?.data) return;

  const suggested = str(branding.data.suggestedClientName) || str(branding.data.brandName);
  if (!suggested) return;

  const shouldRename = isSyntheticPhotoClient(project.client);
  const summary = str(branding.data.visionSummary) || str(branding.data.textPreview);
  const detectedUrl = str(branding.data.detectedUrl);
  const whatTheyDo = str(branding.data.whatTheyDo);

  if (!shouldRename && !summary) return;

  const nextClient = shouldRename ? suggested : project.client;
  const noteBits = [
    project.notes,
    summary && !project.notes?.includes(summary.slice(0, 40)) ? `Photo read: ${summary}` : undefined,
    whatTheyDo && !project.notes?.includes(whatTheyDo) ? `Offer: ${whatTheyDo}` : undefined,
  ].filter(Boolean);

  const next = {
    ...project,
    client: nextClient,
    url: project.url || (detectedUrl?.startsWith('http') ? detectedUrl : project.url),
    notes: noteBits.join('\n\n') || project.notes,
    context: {
      ...project.context,
      seed: {
        ...project.context.seed,
        client: nextClient,
        url: project.context.seed.url || (detectedUrl?.startsWith('http') ? detectedUrl : project.context.seed.url),
        notes: noteBits.join('\n\n') || project.context.seed.notes,
      },
    },
    updatedAt: new Date().toISOString(),
  };

  await saveFactoryProject(next);
  console.info('[factory-research] applied image identity', {
    projectId,
    from: project.client,
    to: nextClient,
  });
}

export function researchCanRun(context: ProjectContext): boolean {
  return researchCanRunPure(context);
}

export async function executeResearch(context: ProjectContext): Promise<CapabilityExecutionResult> {
  const projectId = context.projectId;

  if (!researchCanRun(context)) {
    console.info('[factory-research] skip — canRun false', {
      projectId,
      status: context.pipelineStatus,
    });
    return {
      ran: false,
      project: await getProject(projectId),
      context: await loadProjectContext(projectId),
      detail: 'skip',
    };
  }

  const intakeOutput = getLatestProjectContextOutput(context, 'intake');
  const intakePayload = intakeOutput?.payload?.intake as { primarySourceType?: string } | undefined;

  console.info('[factory-research] start', {
    projectId,
    client: context.seed.client,
    primarySourceType: intakePayload?.primarySourceType,
    schemaVersion: context.schemaVersion,
    hasUrl: Boolean(context.seed.url),
    attachmentCount: context.seed.attachments?.length ?? 0,
  });

  // Mark progress immediately so a timeout during website fetch does not look like a stuck intake.
  await setProjectContextStatus(
    projectId,
    'RESEARCHING',
    'research',
    'Research capability collecting artifacts',
  );

  const { drafts, runs } = await collectResearchArtifacts(context);

  console.info('[factory-research] providers finished', {
    projectId,
    draftCount: drafts.length,
    providers: runs.map((run) => `${run.providerId}:${run.artifactCount}${run.ok ? '' : '!err'}`),
  });

  const appended = drafts.length
    ? await appendArtifacts(projectId, drafts)
    : { appended: [], context: await loadProjectContext(projectId), project: await getProject(projectId) };

  try {
    await applyImageSignalIdentity(projectId);
  } catch (err) {
    console.error('[factory-research] image identity failed', projectId, err);
  }

  const artifactIds = (appended?.appended || []).map((item) => item.id);
  // Prefer full artifact list ids when append was partial/idempotent
  const latestContext = appended?.context || (await loadProjectContext(projectId));
  const allArtifactIds = (latestContext?.artifacts || []).map((item) => item.id);

  const result = await appendProjectContextOutput(projectId, {
    kind: 'research',
    worker: 'research',
    payload: {
      stub: false,
      phase: 4,
      basedOnIntakeOutputId: intakeOutput?.id ?? null,
      seedClient: context.seed.client,
      primarySourceType: intakePayload?.primarySourceType ?? null,
      artifactIds: artifactIds.length ? artifactIds : allArtifactIds,
      artifactCount: (latestContext?.artifacts || []).length,
      providers: runs,
      note: 'Research Capability — structured artifacts only (no AI summarization)',
    },
    pipelineStatus: 'RESEARCHING',
    detail: `Research complete · artifacts=${(latestContext?.artifacts || []).length} · providers=${runs.length}`,
  });

  console.info('[factory-research] complete', {
    projectId,
    status: result?.project.pipelineStatus,
    artifacts: result?.context.artifacts?.length ?? 0,
    outputs: result?.context.outputs.length,
  });

  return {
    ran: true,
    project: result?.project ?? null,
    context: result?.context ?? null,
    detail: `artifacts=${result?.context.artifacts?.length ?? 0}`,
  };
}

export const researchCapability: Capability = {
  id: 'research',
  dependencies: ['intake'],
  canRun: researchCanRun,
  execute: executeResearch,
};
