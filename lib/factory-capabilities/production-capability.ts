/**
 * ProductionController — reads pending WorkOrders, dispatches Builder Registry.
 * Phase 7: WebsiteBuilder only. No portal/learning/report builders.
 */
import { productionCanRun as productionCanRunPure } from '@/lib/factory-capability-gates.mjs';
import type { Capability, CapabilityExecutionResult } from '@/lib/factory-capability';
import {
  appendArtifacts,
  type ArtifactDraft,
  type ArtifactKind,
} from '@/lib/factory-artifact';
import { bootstrapBuilderRegistry, defaultBuilderRegistry } from '@/lib/factory-builders';
import {
  computeWorkOrderMetrics,
  createProductionProgress,
  productionProgressToArtifactDraft,
} from '@/lib/factory-production-progress.mjs';
import { summarizeReviewGates } from '@/lib/factory-review-gate.mjs';
import { listPendingWorkOrders, listWorkOrdersFromArtifacts } from '@/lib/factory-work-order.mjs';
import {
  appendProjectContextOutput,
  getLatestProjectContextOutput,
  loadProjectContext,
  setProjectContextStatus,
  type ProjectContext,
} from '@/lib/factory-project-context';
import { getProject } from '@/lib/factory-project';

export function productionCanRun(context: ProjectContext): boolean {
  return productionCanRunPure(context);
}

export async function executeProduction(context: ProjectContext): Promise<CapabilityExecutionResult> {
  const projectId = context.projectId;
  bootstrapBuilderRegistry();

  if (!productionCanRun(context)) {
    console.info('[factory-production] skip — canRun false', {
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

  const planningOutput = getLatestProjectContextOutput(context, 'planning');
  const registry = defaultBuilderRegistry;
  const supportedTypes = registry.supportedWorkOrderTypes();
  const pending = listPendingWorkOrders(context.artifacts || []).filter((wo) =>
    supportedTypes.includes(wo.type),
  );

  console.info('[factory-production] start', {
    projectId,
    client: context.seed.client,
    pendingWorkOrders: pending.map((wo) => `${wo.type}:${wo.id}`),
    builders: registry.list().map((b) => b.id),
  });

  await setProjectContextStatus(
    projectId,
    'BUILDING',
    'production',
    'ProductionController dispatching builders',
  );

  try {
    const allDrafts: ArtifactDraft[] = [];
    const builderRuns: Array<Record<string, unknown>> = [];
    let websiteArtifactsCreated = 0;
    let deliverablesCreated = 0;
    let reviewGatesCreated = 0;
    const createdReviewGates: unknown[] = [];

    for (const workOrder of pending) {
      const builder = registry.getByWorkOrderType(workOrder.type);
      if (!builder) {
        console.info('[factory-production] no builder', {
          projectId,
          workOrderId: workOrder.id,
          type: workOrder.type,
        });
        continue;
      }

      if (!builder.canBuild(workOrder, context)) {
        console.info('[factory-production] builder skip', {
          projectId,
          builderId: builder.id,
          workOrderId: workOrder.id,
        });
        continue;
      }

      console.info('[factory-production] dispatch builder', {
        projectId,
        builderId: builder.id,
        workOrderId: workOrder.id,
        workOrderType: workOrder.type,
      });

      const result = builder.build(workOrder, {
        artifacts: context.artifacts,
        projectId,
        seedClient: context.seed.client,
      });

      if (!result?.ok) {
        console.error('[factory-production] builder failed', {
          projectId,
          builderId: builder.id,
          detail: result?.detail,
        });
        builderRuns.push({
          builderId: builder.id,
          workOrderId: workOrder.id,
          ok: false,
          detail: result?.detail || 'failed',
        });
        continue;
      }

      for (const draft of result.drafts || []) {
        allDrafts.push({
          id: draft.id,
          kind: draft.kind as ArtifactKind,
          providerId: draft.providerId,
          provenance: draft.provenance,
          data: draft.data,
        });
      }

      websiteArtifactsCreated += result.metrics?.websiteArtifactsCreated || 0;
      deliverablesCreated += result.metrics?.deliverablesCreated || 0;
      reviewGatesCreated += result.metrics?.reviewGatesCreated || 0;
      if (Array.isArray(result.reviewGates)) {
        createdReviewGates.push(...result.reviewGates);
      }

      builderRuns.push({
        builderId: builder.id,
        workOrderId: workOrder.id,
        ok: true,
        detail: result.detail,
        deliverableId: result.deliverable?.id,
        websiteArtifactId: result.websiteArtifact?.id,
      });

      console.info('[factory-production] builder complete', {
        projectId,
        builderId: builder.id,
        workOrderId: workOrder.id,
        detail: result.detail,
      });
    }

    // Refresh work-order metrics after completion drafts are included
    const projectedArtifacts = [
      ...(context.artifacts || []),
      ...allDrafts.map((d) => ({
        kind: d.kind,
        data: d.data,
        id: d.id,
      })),
    ];
    const latestWorkOrders = listWorkOrdersFromArtifacts(projectedArtifacts as never[]);
    const woMetrics = computeWorkOrderMetrics(latestWorkOrders, supportedTypes);
    const gateSummary = summarizeReviewGates(createdReviewGates as never[]);

    const progress = createProductionProgress({
      id: `run-${Date.now().toString(36)}`,
      projectId,
      status: woMetrics.workOrdersPending === 0 ? 'builders_idle' : 'in_progress',
      metrics: {
        ...woMetrics,
        buildersRun: builderRuns.filter((r) => r.ok).length,
        websiteArtifactsCreated,
        deliverablesCreated,
        reviewGatesCreated,
        reviewGatesPending: gateSummary.pending,
      },
      builderRuns,
      provenance: {
        sourceArtifactIds: [
          planningOutput?.id,
          ...pending.map((wo) => `workorder:${wo.id}`),
        ].filter(Boolean),
        seedClient: context.seed.client,
        notes: 'ProductionController progress snapshot',
      },
    });

    allDrafts.push(productionProgressToArtifactDraft(progress) as ArtifactDraft);

    const metricsLog = {
      projectId,
      ...progress.metrics,
      percentComplete: progress.percentComplete,
      builderRuns: builderRuns.length,
    };
    console.info('[factory-production] metrics', metricsLog);

    const appended = allDrafts.length ? await appendArtifacts(projectId, allDrafts) : null;

    const result = await appendProjectContextOutput(projectId, {
      kind: 'production',
      worker: 'production',
      payload: {
        phase: 7,
        controller: 'ProductionController',
        basedOnPlanningOutputId: planningOutput?.id ?? null,
        buildersRun: builderRuns,
        metrics: progress.metrics,
        percentComplete: progress.percentComplete,
        progressId: progress.id,
        note: 'Production framework — WebsiteBuilder only (no portal/learning/report)',
      },
      pipelineStatus: 'BUILDING',
      detail: `Production · builders=${builderRuns.filter((r) => r.ok).length} · complete=${progress.metrics.workOrdersComplete}/${progress.metrics.workOrdersInScope}`,
    });

    console.info('[factory-production] complete', {
      projectId,
      status: result?.project.pipelineStatus,
      appended: appended?.appended.length ?? 0,
      percentComplete: progress.percentComplete,
    });

    return {
      ran: true,
      project: result?.project ?? null,
      context: result?.context ?? appended?.context ?? null,
      detail: `percentComplete=${progress.percentComplete}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ProductionController failed';
    console.error('[factory-production] failed', projectId, err);
    await setProjectContextStatus(projectId, 'FAILED', 'production', message);
    return {
      ran: true,
      project: await getProject(projectId),
      context: await loadProjectContext(projectId),
      detail: message,
    };
  }
}

export const productionCapability: Capability = {
  id: 'production',
  dependencies: ['planning'],
  canRun: productionCanRun,
  execute: executeProduction,
};
