/**
 * Planning capability — Discovery artifacts → Planning artifacts + WorkOrders.
 * No external requests. No AI. No production builders.
 */
import { planningCanRun as planningCanRunPure } from '@/lib/factory-capability-gates.mjs';
import type { Capability, CapabilityExecutionResult } from '@/lib/factory-capability';
import {
  appendArtifacts,
  listDiscoveryArtifacts,
  type ArtifactDraft,
  type ArtifactKind,
} from '@/lib/factory-artifact';
import {
  derivePlanningBundle,
  planningBundleToArtifactDrafts,
  validatePlanningBundle,
} from '@/lib/factory-planning/derive.mjs';
import {
  appendProjectContextOutput,
  getLatestProjectContextOutput,
  loadProjectContext,
  setProjectContextStatus,
  type ProjectContext,
} from '@/lib/factory-project-context';
import { getProject } from '@/lib/factory-project';

export function planningCanRun(context: ProjectContext): boolean {
  return planningCanRunPure(context);
}

export async function executePlanning(context: ProjectContext): Promise<CapabilityExecutionResult> {
  const projectId = context.projectId;

  if (!planningCanRun(context)) {
    console.info('[factory-planning] skip — canRun false', {
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

  const discoveryArtifacts = listDiscoveryArtifacts(context);
  const intakeOutput = getLatestProjectContextOutput(context, 'intake');
  const discoveryOutput = getLatestProjectContextOutput(context, 'discovery');

  console.info('[factory-planning] start', {
    projectId,
    client: context.seed.client,
    discoveryArtifactCount: discoveryArtifacts.length,
    discoveryKinds: discoveryArtifacts.map((item) => item.kind),
  });

  await setProjectContextStatus(
    projectId,
    'PLANNING',
    'planning',
    'Planning capability deriving plan + WorkOrders from discovery',
  );

  try {
    const bundle = derivePlanningBundle(discoveryArtifacts, {
      projectId,
      seedClient: context.seed.client,
      intakeOutputId: intakeOutput?.id,
      deliverable: context.seed.deliverable,
    });

    const validated = validatePlanningBundle(bundle);
    if (!validated.ok) {
      throw new Error(`Planning bundle invalid: ${validated.errors.join('; ')}`);
    }

    const { allDrafts } = planningBundleToArtifactDrafts(bundle);
    const drafts: ArtifactDraft[] = allDrafts.map((draft) => ({
      id: draft.id,
      kind: draft.kind as ArtifactKind,
      providerId: draft.providerId,
      provenance: {
        ...draft.provenance,
        intakeOutputId: draft.provenance.intakeOutputId || intakeOutput?.id,
      },
      data: draft.data,
    }));

    console.info('[factory-planning] derived', {
      projectId,
      planningDocs: bundle.drafts.length,
      workOrders: bundle.workOrders.length,
      artifactDrafts: drafts.length,
    });

    const appended = await appendArtifacts(projectId, drafts);
    const planningDocIds = (appended?.appended || [])
      .filter((item) => item.kind !== 'work_order')
      .map((item) => item.id);
    const workOrderIds = bundle.workOrders.map((wo) => wo.id);

    const result = await appendProjectContextOutput(projectId, {
      kind: 'planning',
      worker: 'planning',
      payload: {
        phase: 6,
        basedOnDiscoveryOutputId: discoveryOutput?.id ?? null,
        basedOnIntakeOutputId: intakeOutput?.id ?? null,
        discoveryArtifactIds: discoveryArtifacts.map((item) => item.id),
        planningArtifactIds: planningDocIds,
        planningArtifactCount: planningDocIds.length,
        workOrderIds,
        workOrderCount: workOrderIds.length,
        workOrderTypes: bundle.workOrders.map((wo) => wo.type),
        note: 'Planning Capability — structured plan + WorkOrders (no AI / no production builders)',
      },
      pipelineStatus: 'PLANNING',
      detail: `Planning complete · docs=${bundle.drafts.length} · workOrders=${bundle.workOrders.length}`,
    });

    console.info('[factory-planning] complete', {
      projectId,
      status: result?.project.pipelineStatus,
      planningArtifacts: planningDocIds.length,
      workOrders: workOrderIds.length,
      totalArtifacts: result?.context.artifacts?.length ?? 0,
    });

    return {
      ran: true,
      project: result?.project ?? null,
      context: result?.context ?? appended?.context ?? null,
      detail: `planningDocs=${bundle.drafts.length};workOrders=${bundle.workOrders.length}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Planning capability failed';
    console.error('[factory-planning] failed', projectId, err);
    await setProjectContextStatus(projectId, 'FAILED', 'planning', message);
    return {
      ran: true,
      project: await getProject(projectId),
      context: await loadProjectContext(projectId),
      detail: message,
    };
  }
}

export const planningCapability: Capability = {
  id: 'planning',
  dependencies: ['discovery'],
  canRun: planningCanRun,
  execute: executePlanning,
};
