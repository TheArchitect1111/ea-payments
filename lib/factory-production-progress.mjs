/**
 * Production progress + metrics (pure) — persisted as production_progress artifacts.
 */

export const PRODUCTION_PROGRESS_SCHEMA_VERSION = 1;

export function createProductionProgress(input, at = new Date().toISOString()) {
  if (!input?.projectId) {
    throw new Error('ProductionProgress requires projectId');
  }

  const metrics = {
    workOrdersTotal: Number(input.metrics?.workOrdersTotal) || 0,
    workOrdersComplete: Number(input.metrics?.workOrdersComplete) || 0,
    workOrdersPending: Number(input.metrics?.workOrdersPending) || 0,
    workOrdersInScope: Number(input.metrics?.workOrdersInScope) || 0,
    buildersRun: Number(input.metrics?.buildersRun) || 0,
    websiteArtifactsCreated: Number(input.metrics?.websiteArtifactsCreated) || 0,
    deliverablesCreated: Number(input.metrics?.deliverablesCreated) || 0,
    reviewGatesCreated: Number(input.metrics?.reviewGatesCreated) || 0,
    reviewGatesPending: Number(input.metrics?.reviewGatesPending) || 0,
  };

  const percentComplete =
    metrics.workOrdersInScope === 0
      ? 0
      : Math.round((metrics.workOrdersComplete / metrics.workOrdersInScope) * 1000) / 10;

  return {
    schemaVersion: PRODUCTION_PROGRESS_SCHEMA_VERSION,
    id: input.id || `progress-${at}`,
    projectId: input.projectId,
    phase: 'production',
    status: input.status || 'in_progress',
    percentComplete,
    metrics,
    builderRuns: Array.isArray(input.builderRuns) ? input.builderRuns : [],
    createdAt: input.createdAt || at,
    provenance: {
      capabilityId: 'production',
      sourceType: 'production_run',
      sourceArtifactIds: Array.isArray(input.provenance?.sourceArtifactIds)
        ? input.provenance.sourceArtifactIds
        : [],
      seedClient: input.provenance?.seedClient,
      collectedAt: input.provenance?.collectedAt || at,
      notes: input.provenance?.notes,
    },
  };
}

export function productionProgressToArtifactDraft(progress) {
  const p = createProductionProgress(progress);
  return {
    id: `artifact-production-production_progress-${p.id}`,
    kind: 'production_progress',
    providerId: 'production',
    provenance: {
      capabilityId: 'production',
      sourceType: 'production_run',
      sourceArtifactIds: p.provenance.sourceArtifactIds,
      seedClient: p.provenance.seedClient,
      collectedAt: p.provenance.collectedAt,
      notes: p.provenance.notes || 'Production progress snapshot',
    },
    data: { progress: p },
  };
}

export function computeWorkOrderMetrics(workOrders, builderTypes = []) {
  const all = workOrders || [];
  const inScope = all.filter((wo) => builderTypes.includes(wo.type));
  const complete = inScope.filter((wo) => wo.status === 'complete');
  const pending = inScope.filter((wo) => wo.status !== 'complete');
  return {
    workOrdersTotal: all.length,
    workOrdersInScope: inScope.length,
    workOrdersComplete: complete.length,
    workOrdersPending: pending.length,
  };
}
