/**
 * Deliverable model — produced by production builders (append-only via artifacts).
 */

export const DELIVERABLE_SCHEMA_VERSION = 1;

export const DELIVERABLE_TYPES = ['website', 'portal', 'learning', 'report', 'content', 'other'];

export function createDeliverable(input, at = new Date().toISOString()) {
  if (!input?.id || !input?.projectId || !input?.type || !input?.title) {
    throw new Error('Deliverable requires id, projectId, type, and title');
  }
  if (!DELIVERABLE_TYPES.includes(input.type)) {
    throw new Error(`Unsupported Deliverable type: ${input.type}`);
  }
  const sourceArtifactIds = Array.isArray(input.provenance?.sourceArtifactIds)
    ? [...new Set(input.provenance.sourceArtifactIds.filter(Boolean).map(String))]
    : [];
  const workOrderIds = Array.isArray(input.workOrderIds)
    ? [...new Set(input.workOrderIds.filter(Boolean).map(String))]
    : [];
  if (workOrderIds.length === 0) {
    throw new Error('Deliverable requires workOrderIds');
  }

  return {
    schemaVersion: DELIVERABLE_SCHEMA_VERSION,
    id: input.id,
    projectId: input.projectId,
    type: input.type,
    title: String(input.title),
    summary: input.summary ? String(input.summary) : '',
    status: input.status || 'ready_for_review',
    workOrderIds,
    artifactIds: Array.isArray(input.artifactIds) ? input.artifactIds.map(String) : [],
    createdAt: input.createdAt || at,
    provenance: {
      capabilityId: input.provenance?.capabilityId || 'production',
      sourceType: input.provenance?.sourceType || 'work_order',
      sourceArtifactIds,
      workOrderIds,
      seedClient: input.provenance?.seedClient,
      collectedAt: input.provenance?.collectedAt || at,
      notes: input.provenance?.notes,
    },
    payload: input.payload && typeof input.payload === 'object' ? { ...input.payload } : {},
  };
}

export function createDeliverableId(type, nonce = '') {
  return `deliverable-${type}-${nonce || Date.now().toString(36)}`;
}

export function deliverableToArtifactDraft(deliverable) {
  const d = createDeliverable(deliverable);
  return {
    id: `artifact-production-deliverable-${d.id}`,
    kind: 'deliverable',
    providerId: 'production',
    provenance: {
      capabilityId: 'production',
      sourceType: 'work_order',
      sourceArtifactIds: d.provenance.sourceArtifactIds,
      seedClient: d.provenance.seedClient,
      collectedAt: d.provenance.collectedAt,
      notes: d.provenance.notes || `Deliverable ${d.type}`,
    },
    data: { deliverable: d },
  };
}

export function listDeliverablesFromArtifacts(artifacts) {
  return (artifacts || [])
    .filter((item) => item.kind === 'deliverable')
    .map((item) => item.data?.deliverable)
    .filter(Boolean)
    .map((raw) => createDeliverable(raw, raw.createdAt));
}
