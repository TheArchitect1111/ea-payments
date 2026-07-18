/**
 * Pure WorkOrder model — emitted by Planning for downstream production.
 * Persisted as append-only artifacts (kind: work_order) via ArtifactService.
 * Completion appends a new work_order artifact (same WorkOrder id, status complete).
 */

export const WORK_ORDER_SCHEMA_VERSION = 1;

export const WORK_ORDER_TYPES = [
  'website',
  'portal',
  'learning',
  'content',
  'branding',
  'accessibility',
  'automation',
  'qa',
  'integration',
];

/**
 * @param {object} input
 * @param {string} [at]
 */
export function createWorkOrder(input, at = new Date().toISOString()) {
  if (!input?.id || !input?.projectId || !input?.type || !input?.title) {
    throw new Error('WorkOrder requires id, projectId, type, and title');
  }
  if (!WORK_ORDER_TYPES.includes(input.type)) {
    throw new Error(`Unsupported WorkOrder type: ${input.type}`);
  }
  const sourceArtifactIds = Array.isArray(input.provenance?.sourceArtifactIds)
    ? [...new Set(input.provenance.sourceArtifactIds.filter(Boolean).map(String))]
    : [];
  if (sourceArtifactIds.length === 0) {
    throw new Error('WorkOrder provenance requires sourceArtifactIds (Discovery artifacts)');
  }

  return {
    schemaVersion: WORK_ORDER_SCHEMA_VERSION,
    id: input.id,
    projectId: input.projectId,
    type: input.type,
    title: String(input.title),
    summary: input.summary ? String(input.summary) : '',
    priority: input.priority || 'medium',
    status: input.status || 'ready',
    deliverable: input.deliverable ? String(input.deliverable) : '',
    acceptanceCriteria: Array.isArray(input.acceptanceCriteria)
      ? input.acceptanceCriteria.map(String)
      : [],
    dependencies: Array.isArray(input.dependencies) ? input.dependencies.map(String) : [],
    createdAt: input.createdAt || at,
    provenance: {
      capabilityId: input.provenance.capabilityId || 'planning',
      sourceType: input.provenance.sourceType || 'discovery_artifacts',
      sourceArtifactIds,
      seedClient: input.provenance?.seedClient,
      intakeOutputId: input.provenance?.intakeOutputId,
      collectedAt: input.provenance?.collectedAt || at,
      notes: input.provenance?.notes,
    },
    payload: input.payload && typeof input.payload === 'object' ? { ...input.payload } : {},
  };
}

export function createWorkOrderId(type, nonce = '') {
  return `workorder-${type}-${nonce || Date.now().toString(36)}`;
}

/**
 * Convert WorkOrder → Artifact draft (kind work_order).
 * Completion snapshots use a distinct artifact id (append-only; never overwrite).
 */
export function workOrderToArtifactDraft(workOrder, options = {}) {
  const wo = createWorkOrder(workOrder);
  const artifactId =
    options.artifactId ||
    (wo.status === 'complete'
      ? `artifact-work_order-${wo.id}-complete`
      : `artifact-planning-work_order-${wo.id}`);

  return {
    id: artifactId,
    kind: 'work_order',
    providerId: options.providerId || (wo.status === 'complete' ? 'production' : 'planning'),
    provenance: {
      // Preserve planning capabilityId on the WorkOrder contract for lineage validators
      capabilityId: wo.provenance.capabilityId || 'planning',
      sourceType: wo.provenance.sourceType || 'discovery_artifacts',
      sourceArtifactIds: wo.provenance.sourceArtifactIds,
      seedClient: wo.provenance.seedClient,
      intakeOutputId: wo.provenance.intakeOutputId,
      collectedAt: wo.provenance.collectedAt,
      notes: wo.provenance.notes || `WorkOrder ${wo.type} (${wo.status})`,
    },
    data: {
      workOrder: wo,
    },
  };
}

export function artifactToWorkOrder(artifact) {
  if (!artifact || artifact.kind !== 'work_order') return null;
  const embedded = artifact.data?.workOrder;
  if (embedded) return createWorkOrder(embedded, embedded.createdAt || artifact.createdAt);
  return null;
}

/** Latest WorkOrder snapshot per id (append-only status history). */
export function listWorkOrdersFromArtifacts(artifacts) {
  const byId = new Map();
  for (const item of artifacts || []) {
    if (item.kind !== 'work_order') continue;
    const wo = artifactToWorkOrder(item);
    if (!wo) continue;
    const prev = byId.get(wo.id);
    if (!prev || String(wo.createdAt) >= String(prev.createdAt)) {
      byId.set(wo.id, wo);
    }
  }
  return [...byId.values()];
}

export function listPendingWorkOrders(artifacts, type) {
  return listWorkOrdersFromArtifacts(artifacts).filter((wo) => {
    if (wo.status === 'complete' || wo.status === 'cancelled') return false;
    if (type && wo.type !== type) return false;
    return true;
  });
}

export function validateWorkOrderLineage(workOrders) {
  const errors = [];
  for (const wo of workOrders || []) {
    const ids = wo.provenance?.sourceArtifactIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      errors.push(`${wo.id} missing sourceArtifactIds`);
    }
    if (wo.provenance?.capabilityId !== 'planning') {
      errors.push(`${wo.id} capabilityId must be planning`);
    }
  }
  return { ok: errors.length === 0, errors };
}
