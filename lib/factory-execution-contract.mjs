/** Mandatory execution contract and verification gates for all production builders. */
import {
  createReviewGate,
  createReviewGateId,
  reviewGateToArtifactDraft,
} from './factory-review-gate.mjs';
import {
  createAssetIntegrityGate,
  createVisualFidelityGate,
} from './factory-build-verification-gates.mjs';

export const EXECUTION_CONTRACT_SCHEMA_VERSION = 2;

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');
const unique = (items) => [...new Set((items || []).filter(Boolean).map(String))];

function normalizeRequirement(input, index) {
  if (typeof input === 'string') {
    const label = cleanText(input);
    if (!label) return null;
    return { id: `requirement-${index + 1}`, label, required: true, verification: 'visual_or_manual', expected: true, source: 'acceptance_criteria' };
  }
  if (!input || typeof input !== 'object') return null;
  const label = cleanText(input.label || input.description || input.text);
  if (!label) return null;
  return {
    id: cleanText(input.id) || `requirement-${index + 1}`,
    label,
    required: input.required !== false,
    verification: cleanText(input.verification) || 'visual_or_manual',
    expected: input.expected === undefined ? true : input.expected,
    target: input.target ?? null,
    source: cleanText(input.source) || 'approved_instruction',
  };
}

function normalizeAsset(input, index) {
  if (typeof input === 'string') return { id: `asset-${index + 1}`, path: input, role: '', required: true };
  if (!input || typeof input !== 'object') return null;
  const path = cleanText(input.path || input.src);
  if (!path) return null;
  return { id: cleanText(input.id) || `asset-${index + 1}`, path, role: cleanText(input.role), required: input.required !== false };
}

export function createExecutionContract(workOrder, at = new Date().toISOString()) {
  if (!workOrder?.id || !workOrder?.projectId || !workOrder?.type) throw new Error('ExecutionContract requires a valid WorkOrder');
  const explicit = Array.isArray(workOrder.payload?.executionRequirements) ? workOrder.payload.executionRequirements : [];
  const acceptance = Array.isArray(workOrder.acceptanceCriteria) ? workOrder.acceptanceCriteria : [];
  const source = explicit.length ? explicit : acceptance;
  const requirements = source.map(normalizeRequirement).filter(Boolean);
  if (!requirements.length) requirements.push({ id: 'requirement-1', label: `Deliver ${workOrder.title} exactly as approved`, required: true, verification: 'visual_or_manual', expected: true, target: null, source: 'work_order_fallback' });

  const requiredAssets = (Array.isArray(workOrder.payload?.requiredAssets) ? workOrder.payload.requiredAssets : []).map(normalizeAsset).filter(Boolean);
  const protectedSections = unique(workOrder.payload?.protectedSections || []);
  const allowedChanges = unique(workOrder.payload?.allowedChanges || []);
  const id = `execution-contract-${workOrder.id}`;

  return {
    schemaVersion: EXECUTION_CONTRACT_SCHEMA_VERSION,
    id,
    projectId: workOrder.projectId,
    workOrderId: workOrder.id,
    workOrderType: workOrder.type,
    title: `Execution contract: ${workOrder.title}`,
    createdAt: at,
    immutableRules: {
      diffOnly: true,
      noScopeCreep: true,
      noSubstitutionsWithoutApproval: true,
      assetIntegrityRequired: true,
      visualVerificationRequired: true,
      visualFidelityRequired: true,
      protectedSectionsMustRemainUnchanged: true,
      deliveryBlockedUntilPassed: true,
    },
    requirements,
    requiredAssets,
    protectedSections,
    allowedChanges,
    status: 'verification_pending',
    provenance: {
      capabilityId: 'production',
      sourceType: 'approved_work_order',
      sourceArtifactIds: unique(workOrder.provenance?.sourceArtifactIds || []),
      seedClient: workOrder.provenance?.seedClient,
      collectedAt: at,
    },
  };
}

export function executionContractToArtifactDraft(contract) {
  return {
    id: `artifact-production-execution_contract-${contract.id}`,
    kind: 'execution_contract',
    providerId: 'production',
    provenance: { capabilityId: 'production', sourceType: contract.provenance.sourceType, sourceArtifactIds: contract.provenance.sourceArtifactIds, seedClient: contract.provenance.seedClient, collectedAt: contract.provenance.collectedAt, notes: `Mandatory execution contract for ${contract.workOrderId}` },
    data: { executionContract: contract },
  };
}

export function createExecutionVerificationGate({ contract, deliverableId = null, at = new Date().toISOString() }) {
  return createReviewGate({
    id: createReviewGateId('execution-verification', contract.workOrderId.slice(-8)),
    projectId: contract.projectId,
    gateId: 'execution-verification',
    title: 'Execution contract verification',
    description: 'All approved requirements must pass. Asset Integrity and Visual Fidelity must also pass before delivery.',
    status: 'pending', required: true, deliverableId, workOrderIds: [contract.workOrderId],
    provenance: { sourceType: 'execution_contract', sourceArtifactIds: [`artifact-production-execution_contract-${contract.id}`, ...contract.provenance.sourceArtifactIds], seedClient: contract.provenance.seedClient, collectedAt: at, notes: 'Mandatory final execution verification gate' },
  }, at);
}

export function evaluateExecutionContract(contract, results = [], at = new Date().toISOString()) {
  const byId = new Map((results || []).map((item) => [String(item.id), item]));
  const checks = contract.requirements.map((requirement) => {
    const result = byId.get(requirement.id);
    return { id: requirement.id, label: requirement.label, required: requirement.required, passed: Boolean(result?.passed), evidence: result?.evidence || null, note: result?.note || null };
  });
  const failedRequired = checks.filter((item) => item.required && !item.passed);
  const status = failedRequired.length ? 'failed' : 'passed';
  return { schemaVersion: 1, contractId: contract.id, workOrderId: contract.workOrderId, evaluatedAt: at, status, deliveryAllowed: status === 'passed', failedRequiredIds: failedRequired.map((item) => item.id), checks };
}

export function executionVerificationToGateArtifact({ gate, verification, at = new Date().toISOString() }) {
  const updated = createReviewGate({ ...gate, status: verification.status === 'passed' ? 'passed' : 'failed', provenance: { ...gate.provenance, collectedAt: at, notes: `Execution verification ${verification.status}; failed=${verification.failedRequiredIds.join(',') || 'none'}` } }, at);
  return reviewGateToArtifactDraft(updated);
}

export function executionContractAllowsDelivery(contract, verification, gateResults = {}) {
  return Boolean(
    contract?.immutableRules?.deliveryBlockedUntilPassed &&
    verification?.contractId === contract?.id && verification?.status === 'passed' && verification?.deliveryAllowed === true &&
    gateResults?.assetIntegrity?.status === 'passed' && gateResults?.assetIntegrity?.deliveryAllowed === true &&
    gateResults?.visualFidelity?.status === 'passed' && gateResults?.visualFidelity?.deliveryAllowed === true
  );
}

export function wrapBuilderWithExecutionContract(builder) {
  if (!builder?.id || typeof builder.build !== 'function') throw new Error('Execution-contract wrapper requires a valid builder');
  if (builder.executionContractWrapped) return builder;
  return {
    ...builder,
    executionContractWrapped: true,
    build(workOrder, context = {}, at = new Date().toISOString()) {
      const result = builder.build(workOrder, context, at);
      if (!result?.ok) return result;
      const contract = createExecutionContract(workOrder, at);
      const contractArtifact = executionContractToArtifactDraft(contract);
      const deliverableId = result.deliverable?.id || null;
      const executionGate = createExecutionVerificationGate({ contract, deliverableId, at });
      const assetGate = createAssetIntegrityGate({ contract, deliverableId, at });
      const visualGate = createVisualFidelityGate({ contract, deliverableId, at });
      const gates = [executionGate, assetGate, visualGate];
      return {
        ...result,
        drafts: [...(result.drafts || []), contractArtifact, ...gates.map(reviewGateToArtifactDraft)],
        reviewGates: [...(result.reviewGates || []), ...gates],
        executionContract: contract,
        executionVerificationGate: executionGate,
        assetIntegrityGate: assetGate,
        visualFidelityGate: visualGate,
        deliveryBlocked: true,
        deliveryBlockReason: 'mandatory_build_verification_pending',
        metrics: { ...(result.metrics || {}), executionContractsCreated: 1, reviewGatesCreated: (result.metrics?.reviewGatesCreated || 0) + 3 },
      };
    },
  };
}
