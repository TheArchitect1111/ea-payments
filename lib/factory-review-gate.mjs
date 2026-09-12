/**
 * Review Gates — human/system gates before publish (append-only artifacts).
 */

export const REVIEW_GATE_SCHEMA_VERSION = 1;
export const REVIEW_GATE_STATUSES = ['pending', 'passed', 'failed', 'waived'];

export function createReviewGate(input, at = new Date().toISOString()) {
  if (!input?.id || !input?.projectId || !input?.gateId || !input?.title) throw new Error('ReviewGate requires id, projectId, gateId, and title');
  const sourceArtifactIds = Array.isArray(input.provenance?.sourceArtifactIds)
    ? [...new Set(input.provenance.sourceArtifactIds.filter(Boolean).map(String))] : [];
  if (sourceArtifactIds.length === 0) throw new Error('ReviewGate provenance requires sourceArtifactIds');
  const status = input.status || 'pending';
  if (!REVIEW_GATE_STATUSES.includes(status)) throw new Error(`Unsupported ReviewGate status: ${status}`);
  return {
    schemaVersion: REVIEW_GATE_SCHEMA_VERSION,
    id: input.id,
    projectId: input.projectId,
    gateId: String(input.gateId),
    title: String(input.title),
    description: input.description ? String(input.description) : '',
    status,
    required: input.required !== false,
    deliverableId: input.deliverableId || null,
    workOrderIds: Array.isArray(input.workOrderIds) ? input.workOrderIds.map(String) : [],
    createdAt: input.createdAt || at,
    provenance: {
      capabilityId: input.provenance?.capabilityId || 'production',
      sourceType: input.provenance?.sourceType || 'website_artifacts',
      sourceArtifactIds,
      seedClient: input.provenance?.seedClient,
      collectedAt: input.provenance?.collectedAt || at,
      notes: input.provenance?.notes,
    },
  };
}

export function createReviewGateId(gateId, nonce = '') {
  return `reviewgate-${gateId}-${nonce || Date.now().toString(36)}`;
}

export function reviewGateToArtifactDraft(gate) {
  const g = createReviewGate(gate);
  return {
    id: `artifact-${g.provenance.capabilityId || 'production'}-review_gate-${g.id}-${String(g.createdAt).replace(/[^0-9]/g, '').slice(-10)}`,
    kind: 'review_gate',
    providerId: g.provenance.capabilityId || 'production',
    provenance: {
      capabilityId: g.provenance.capabilityId || 'production',
      sourceType: g.provenance.sourceType,
      sourceArtifactIds: g.provenance.sourceArtifactIds,
      seedClient: g.provenance.seedClient,
      collectedAt: g.provenance.collectedAt,
      notes: g.provenance.notes || `ReviewGate ${g.gateId}`,
    },
    data: { reviewGate: g },
  };
}

/** Resolve the current semantic gate state while preserving every historical artifact. */
export function listReviewGatesFromArtifacts(artifacts) {
  const latest = new Map();
  for (const item of artifacts || []) {
    if (item.kind !== 'review_gate') continue;
    const raw = item.data?.reviewGate;
    if (!raw) continue;
    const gate = createReviewGate(raw, raw.createdAt);
    const key = gate.id || gate.gateId;
    const previous = latest.get(key);
    if (!previous || String(gate.createdAt) >= String(previous.createdAt)) latest.set(key, gate);
  }
  return [...latest.values()];
}

export function summarizeReviewGates(gates) {
  const list = gates || [];
  return {
    total: list.length,
    pending: list.filter((g) => g.status === 'pending').length,
    passed: list.filter((g) => g.status === 'passed').length,
    failed: list.filter((g) => g.status === 'failed').length,
    requiredPending: list.filter((g) => g.required && g.status === 'pending').length,
    requiredFailed: list.filter((g) => g.required && g.status === 'failed').length,
  };
}

export function reviewGatesAllowPublish(gates) {
  const required = (gates || []).filter((gate) => gate.required);
  const blockers = required.filter((gate) => gate.status !== 'passed' && gate.status !== 'waived');
  return {
    ok: blockers.length === 0,
    blockers: blockers.map((gate) => ({ id: gate.id, gateId: gate.gateId, title: gate.title, status: gate.status })),
  };
}
