/**
 * Execution Contract — converts approved build instructions into machine-checkable
 * requirements and blocks delivery until every required item is verified.
 */

import {
  createReviewGate,
  createReviewGateId,
  reviewGateToArtifactDraft,
} from './factory-review-gate.mjs';

export const EXECUTION_CONTRACT_SCHEMA_VERSION = 1;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRequirement(input, index) {
  if (typeof input === 'string') {
    const text = cleanText(input);
    if (!text) return null;
    return {
      id: `requirement-${index + 1}`,
      label: text,
      required: true,
      verification: 'visual_or_manual',
      expected: true,
      source: 'acceptance_criteria',
    };
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

export function createExecutionContract(workOrder, at = new Date().toISOString()) {
  if (!workOrder?.id || !workOrder?.projectId || !workOrder?.type) {
    throw new Error('ExecutionContract requires a valid WorkOrder');
  }

  const explicit = Array.isArray(workOrder.payload?.executionRequirements)
    ? workOrder.payload.executionRequirements
    : [];
  const acceptance = Array.isArray(workOrder.acceptanceCriteria)
    ? workOrder.acceptanceCriteria
    : [];
  const source = explicit.length ? explicit : acceptance;
  const requirements = source.map(normalizeRequirement).filter(Boolean);

  if (requirements.length === 0) {
    requirements.push({
      id: 'requirement-1',
      label: `Deliver ${workOrder.title} exactly as approved`,
      required: true,
      verification: 'visual_or_manual',
      expected: true,
      target: null,
      source: 'work_order_fallback',
    });
  }

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
      visualVerificationRequired: true,
      deliveryBlockedUntilPassed: true,
    },
    requirements,
    status: 'verification_pending',
    provenance: {
      capabilityId: 'production',
      sourceType: 'approved_work_order',
      sourceArtifactIds: [...new Set((workOrder.provenance?.sourceArtifactIds || []).map(String))],
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
    provenance: {
      capabilityId: 'production',
      sourceType: contract.provenance.sourceType,
      sourceArtifactIds: contract.provenance.sourceArtifactIds,
      seedClient: contract.provenance.seedClient,
      collectedAt: contract.provenance.collectedAt,
      notes: `Mandatory execution contract for ${contract.workOrderId}`,
    },
    data: { executionContract: contract },
  };
}

export function createExecutionVerificationGate({
  contract,
  deliverableId = null,
  at = new Date().toISOString(),
}) {
  const sourceArtifactIds = [
    `artifact-production-execution_contract-${contract.id}`,
    ...contract.provenance.sourceArtifactIds,
  ];

  return createReviewGate(
    {
      id: createReviewGateId('execution-verification', contract.workOrderId.slice(-8)),
      projectId: contract.projectId,
      gateId: 'execution-verification',
      title: 'Execution contract verification',
      description:
        'All approved requirements must be verified against the rendered/deployed deliverable. Any required miss blocks delivery.',
      status: 'pending',
      required: true,
      deliverableId,
      workOrderIds: [contract.workOrderId],
      provenance: {
        sourceType: 'execution_contract',
        sourceArtifactIds,
        seedClient: contract.provenance.seedClient,
        collectedAt: at,
        notes: 'Mandatory post-build visual/instruction verification gate',
      },
    },
    at,
  );
}

export function evaluateExecutionContract(contract, results = [], at = new Date().toISOString()) {
  const byId = new Map((results || []).map((item) => [String(item.id), item]));
  const checks = contract.requirements.map((requirement) => {
    const result = byId.get(requirement.id);
    const passed = Boolean(result?.passed);
    return {
      id: requirement.id,
      label: requirement.label,
      required: requirement.required,
      passed,
      evidence: result?.evidence || null,
      note: result?.note || null,
    };
  });

  const failedRequired = checks.filter((item) => item.required && !item.passed);
  const status = failedRequired.length ? 'failed' : 'passed';

  return {
    schemaVersion: 1,
    contractId: contract.id,
    workOrderId: contract.workOrderId,
    evaluatedAt: at,
    status,
    deliveryAllowed: status === 'passed',
    failedRequiredIds: failedRequired.map((item) => item.id),
    checks,
  };
}

export function executionVerificationToGateArtifact({
  gate,
  verification,
  at = new Date().toISOString(),
}) {
  const updated = createReviewGate(
    {
      ...gate,
      status: verification.status === 'passed' ? 'passed' : 'failed',
      provenance: {
        ...gate.provenance,
        collectedAt: at,
        notes: `Execution verification ${verification.status}; failed=${verification.failedRequiredIds.join(',') || 'none'}`,
      },
    },
    at,
  );
  return reviewGateToArtifactDraft(updated);
}

export function executionContractAllowsDelivery(contract, verification) {
  return Boolean(
    contract?.immutableRules?.deliveryBlockedUntilPassed &&
      verification?.contractId === contract?.id &&
      verification?.status === 'passed' &&
      verification?.deliveryAllowed === true,
  );
}

/**
 * Wrap any production builder so every future builder automatically inherits
 * the mandatory execution contract and verification gate.
 */
export function wrapBuilderWithExecutionContract(builder) {
  if (!builder?.id || typeof builder.build !== 'function') {
    throw new Error('Execution-contract wrapper requires a valid builder');
  }
  if (builder.executionContractWrapped) return builder;

  return {
    ...builder,
    executionContractWrapped: true,
    build(workOrder, context = {}, at = new Date().toISOString()) {
      const result = builder.build(workOrder, context, at);
      if (!result?.ok) return result;

      const contract = createExecutionContract(workOrder, at);
      const contractArtifact = executionContractToArtifactDraft(contract);
      const gate = createExecutionVerificationGate({
        contract,
        deliverableId: result.deliverable?.id || null,
        at,
      });
      const gateArtifact = reviewGateToArtifactDraft(gate);

      const reviewGates = [...(result.reviewGates || []), gate];
      const drafts = [...(result.drafts || []), contractArtifact, gateArtifact];

      return {
        ...result,
        drafts,
        reviewGates,
        executionContract: contract,
        executionVerificationGate: gate,
        deliveryBlocked: true,
        deliveryBlockReason: 'execution_verification_pending',
        metrics: {
          ...(result.metrics || {}),
          executionContractsCreated: 1,
          reviewGatesCreated: (result.metrics?.reviewGatesCreated || 0) + 1,
        },
      };
    },
  };
}
