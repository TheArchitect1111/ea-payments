/**
 * Discovery capability — derives structured Discovery artifacts from Research artifacts only.
 * No web requests, external APIs, or AI summarization.
 */
import { discoveryCanRun as discoveryCanRunPure } from '@/lib/factory-capability-gates.mjs';
import type { Capability, CapabilityExecutionResult } from '@/lib/factory-capability';
import {
  appendArtifacts,
  listResearchArtifacts,
  type ArtifactDraft,
  type ArtifactKind,
} from '@/lib/factory-artifact';
import {
  deriveDiscoveryDrafts,
  validateDiscoveryDraftLineage,
} from '@/lib/factory-discovery/derive.mjs';
import {
  appendProjectContextOutput,
  getLatestProjectContextOutput,
  loadProjectContext,
  setProjectContextStatus,
  type ProjectContext,
} from '@/lib/factory-project-context';
import { getProject } from '@/lib/factory-project';

export function discoveryCanRun(context: ProjectContext): boolean {
  return discoveryCanRunPure(context);
}

export async function executeDiscovery(context: ProjectContext): Promise<CapabilityExecutionResult> {
  const projectId = context.projectId;

  if (!discoveryCanRun(context)) {
    console.info('[factory-discovery] skip — canRun false', {
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

  const researchArtifacts = listResearchArtifacts(context);
  const intakeOutput = getLatestProjectContextOutput(context, 'intake');
  const researchOutput = getLatestProjectContextOutput(context, 'research');

  console.info('[factory-discovery] start', {
    projectId,
    client: context.seed.client,
    researchArtifactCount: researchArtifacts.length,
    researchKinds: researchArtifacts.map((item) => item.kind),
  });

  await setProjectContextStatus(
    projectId,
    'DISCOVERING',
    'discovery',
    'Discovery capability deriving artifacts from research',
  );

  try {
    const rawDrafts = deriveDiscoveryDrafts(researchArtifacts, {
      seedClient: context.seed.client,
      intakeOutputId: intakeOutput?.id,
    });

    const lineage = validateDiscoveryDraftLineage(rawDrafts);
    if (!lineage.ok) {
      throw new Error(`Discovery lineage invalid: ${lineage.errors.join('; ')}`);
    }

    const drafts: ArtifactDraft[] = rawDrafts.map((draft) => ({
      kind: draft.kind as ArtifactKind,
      providerId: draft.providerId,
      provenance: {
        ...draft.provenance,
        intakeOutputId: draft.provenance.intakeOutputId || intakeOutput?.id,
      },
      data: draft.data,
    }));

    console.info('[factory-discovery] derived', {
      projectId,
      draftCount: drafts.length,
      kinds: drafts.map((d) => d.kind),
    });

    const appended = await appendArtifacts(projectId, drafts);
    const latest = appended?.context || (await loadProjectContext(projectId));
    const discoveryArtifactIds = (appended?.appended || []).map((item) => item.id);
    const recommendations = drafts.find((d) => d.kind === 'recommendations');

    const result = await appendProjectContextOutput(projectId, {
      kind: 'discovery',
      worker: 'discovery',
      payload: {
        phase: 5,
        basedOnResearchOutputId: researchOutput?.id ?? null,
        basedOnIntakeOutputId: intakeOutput?.id ?? null,
        researchArtifactIds: researchArtifacts.map((item) => item.id),
        discoveryArtifactIds,
        discoveryArtifactCount: discoveryArtifactIds.length,
        recommendationCount:
          (recommendations?.data?.recommendations as unknown[] | undefined)?.length ?? 0,
        note: 'Discovery Capability — structured artifacts from research only (no AI / no network)',
      },
      pipelineStatus: 'DISCOVERING',
      detail: `Discovery complete · artifacts=${discoveryArtifactIds.length}`,
    });

    console.info('[factory-discovery] complete', {
      projectId,
      status: result?.project.pipelineStatus,
      discoveryArtifacts: discoveryArtifactIds.length,
      totalArtifacts: result?.context.artifacts?.length ?? 0,
    });

    return {
      ran: true,
      project: result?.project ?? null,
      context: result?.context ?? latest,
      detail: `discoveryArtifacts=${discoveryArtifactIds.length}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Discovery capability failed';
    console.error('[factory-discovery] failed', projectId, err);
    await setProjectContextStatus(projectId, 'FAILED', 'discovery', message);
    return {
      ran: true,
      project: await getProject(projectId),
      context: await loadProjectContext(projectId),
      detail: message,
    };
  }
}

export const discoveryCapability: Capability = {
  id: 'discovery',
  dependencies: ['research'],
  canRun: discoveryCanRun,
  execute: executeDiscovery,
};
