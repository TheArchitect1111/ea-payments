/**
 * Mandatory build verification gates.
 * Asset Integrity Gate: every required local asset must exist and render.
 * Visual Fidelity Gate: rendered output must satisfy frozen requirements and protected sections.
 */

import {
  createReviewGate,
  createReviewGateId,
  reviewGateToArtifactDraft,
} from './factory-review-gate.mjs';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function unique(items) {
  return [...new Set((items || []).filter(Boolean).map(String))];
}

export function createAssetIntegrityGate({ contract, deliverableId = null, at = new Date().toISOString() }) {
  return createReviewGate({
    id: createReviewGateId('asset-integrity', contract.workOrderId.slice(-8)),
    projectId: contract.projectId,
    gateId: 'asset-integrity',
    title: 'Asset Integrity Gate',
    description: 'Every required image, logo, file, and local asset must exist, resolve, and render before the build can be delivered.',
    status: 'pending',
    required: true,
    deliverableId,
    workOrderIds: [contract.workOrderId],
    provenance: {
      sourceType: 'execution_contract',
      sourceArtifactIds: [`artifact-production-execution_contract-${contract.id}`, ...contract.provenance.sourceArtifactIds],
      seedClient: contract.provenance.seedClient,
      collectedAt: at,
      notes: 'Mandatory asset integrity verification gate',
    },
  }, at);
}

export function createVisualFidelityGate({ contract, deliverableId = null, at = new Date().toISOString() }) {
  return createReviewGate({
    id: createReviewGateId('visual-fidelity', contract.workOrderId.slice(-8)),
    projectId: contract.projectId,
    gateId: 'visual-fidelity',
    title: 'Visual Fidelity Gate',
    description: 'Rendered desktop/mobile output must match the frozen execution contract and preserve all protected sections. Unapproved visual drift blocks delivery.',
    status: 'pending',
    required: true,
    deliverableId,
    workOrderIds: [contract.workOrderId],
    provenance: {
      sourceType: 'execution_contract',
      sourceArtifactIds: [`artifact-production-execution_contract-${contract.id}`, ...contract.provenance.sourceArtifactIds],
      seedClient: contract.provenance.seedClient,
      collectedAt: at,
      notes: 'Mandatory rendered-output fidelity verification gate',
    },
  }, at);
}

export function evaluateAssetIntegrity({ requiredAssets = [], observedAssets = [], at = new Date().toISOString() }) {
  const observed = new Map((observedAssets || []).map((asset) => [clean(asset?.id || asset?.path || asset?.src), asset]));
  const checks = (requiredAssets || []).map((asset, index) => {
    const id = clean(asset?.id || asset?.path || asset?.src) || `asset-${index + 1}`;
    const result = observed.get(id);
    const exists = Boolean(result?.exists);
    const resolves = Boolean(result?.resolves ?? result?.exists);
    const renders = Boolean(result?.renders);
    const passed = exists && resolves && renders;
    return {
      id,
      required: asset?.required !== false,
      role: clean(asset?.role),
      expectedPath: clean(asset?.path || asset?.src),
      exists,
      resolves,
      renders,
      passed,
      evidence: result?.evidence || null,
    };
  });
  const failedRequired = checks.filter((check) => check.required && !check.passed);
  return {
    schemaVersion: 1,
    evaluatedAt: at,
    status: failedRequired.length ? 'failed' : 'passed',
    deliveryAllowed: failedRequired.length === 0,
    failedRequiredIds: failedRequired.map((check) => check.id),
    checks,
  };
}

export function evaluateVisualFidelity({
  requirements = [],
  protectedSections = [],
  observedRequirements = [],
  observedSections = [],
  visualChecks = {},
  at = new Date().toISOString(),
}) {
  const observedReq = new Map((observedRequirements || []).map((item) => [String(item.id), item]));
  const requirementChecks = (requirements || []).map((requirement, index) => {
    const id = String(requirement?.id || `requirement-${index + 1}`);
    const observed = observedReq.get(id);
    return {
      id,
      required: requirement?.required !== false,
      label: clean(requirement?.label),
      passed: Boolean(observed?.passed),
      evidence: observed?.evidence || null,
    };
  });

  const renderedSections = new Map((observedSections || []).map((section) => [String(section.id || section.name), section]));
  const protectedChecks = unique(protectedSections).map((id) => {
    const observed = renderedSections.get(id);
    return {
      id,
      present: Boolean(observed?.present),
      unchanged: Boolean(observed?.unchanged),
      passed: Boolean(observed?.present && observed?.unchanged),
      evidence: observed?.evidence || null,
    };
  });

  const viewportChecks = [
    ['mobile_render', visualChecks.mobileRender],
    ['desktop_render', visualChecks.desktopRender],
    ['no_broken_images', visualChecks.noBrokenImages],
    ['no_overflow', visualChecks.noOverflow],
    ['no_unexplained_blank_space', visualChecks.noUnexplainedBlankSpace],
    ['faces_unobstructed_when_required', visualChecks.facesUnobstructedWhenRequired],
  ].map(([id, passed]) => ({ id, passed: Boolean(passed) }));

  const failures = [
    ...requirementChecks.filter((item) => item.required && !item.passed).map((item) => item.id),
    ...protectedChecks.filter((item) => !item.passed).map((item) => `protected:${item.id}`),
    ...viewportChecks.filter((item) => !item.passed).map((item) => item.id),
  ];

  return {
    schemaVersion: 1,
    evaluatedAt: at,
    status: failures.length ? 'failed' : 'passed',
    deliveryAllowed: failures.length === 0,
    failedRequiredIds: failures,
    requirementChecks,
    protectedChecks,
    viewportChecks,
  };
}

export function verificationToGateArtifact({ gate, verification, at = new Date().toISOString() }) {
  const updated = createReviewGate({
    ...gate,
    status: verification.status === 'passed' ? 'passed' : 'failed',
    provenance: {
      ...gate.provenance,
      collectedAt: at,
      notes: `${gate.title}: ${verification.status}; failed=${verification.failedRequiredIds?.join(',') || 'none'}`,
    },
  }, at);
  return reviewGateToArtifactDraft(updated);
}
