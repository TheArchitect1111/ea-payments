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
import { collectResearchArtifacts } from '@/lib/factory-research/run-providers';

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
