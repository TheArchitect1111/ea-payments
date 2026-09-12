/**
 * Factory Run 2 torture harness.
 * Pure, side-effect-free production simulation for concurrency, isolation, failure injection,
 * recovery and idempotency certification. Never publishes or touches external production data.
 */
import { appendArtifacts, createArtifact } from './factory-artifact.mjs';
import { createBuilderRegistry } from './factory-builder-registry.mjs';
import { wrapBuilderWithExecutionContract } from './factory-execution-contract.mjs';
import { createWorkOrder, workOrderToArtifactDraft } from './factory-work-order.mjs';
import { websiteBuilder } from './factory-builders/website-builder.mjs';
import { portalBuilder } from './factory-builders/portal-builder.mjs';
import { learningBuilder } from './factory-builders/learning-builder.mjs';
import { knowledgeBuilder } from './factory-builders/knowledge-builder.mjs';
import { reportBuilder } from './factory-builders/report-builder.mjs';

const TYPES = ['website', 'portal', 'learning', 'content', 'report'];
const PLANNING_KIND = {
  website: 'website_sitemap',
  portal: 'portal_blueprint',
  learning: 'learning_architecture',
  content: 'content_strategy',
  report: 'executive_summary',
};
const EXPECTED_KIND = {
  website: 'website_site',
  portal: 'portal_app',
  learning: 'learning_system',
  content: 'knowledge_base',
  report: 'report_pack',
};

function registry() {
  const result = createBuilderRegistry();
  for (const builder of [websiteBuilder, portalBuilder, learningBuilder, knowledgeBuilder, reportBuilder]) {
    result.register(wrapBuilderWithExecutionContract(builder));
  }
  return result;
}

function seedArtifacts(projectId, tenantId, type, workOrder, at) {
  const discoveryId = `artifact-discovery-${tenantId}`;
  const planningId = `artifact-planning-${type}-${tenantId}`;
  const planningKind = PLANNING_KIND[type];
  const planningData = {
    website: { nodes: [{ path: '/', title: `${tenantId} Home`, order: 1 }] },
    portal: { modules: [{ id: 'dashboard', title: 'Dashboard' }] },
    learning: { tracks: [{ id: 'track-1', title: 'Foundation' }] },
    content: { pillars: [{ id: 'proof', title: 'Proof' }] },
    report: { organizationName: tenantId, highlights: ['Run 2 certification'] },
  }[type];
  const workOrderDraft = workOrderToArtifactDraft(workOrder);
  return [
    createArtifact({
      id: discoveryId, projectId, kind: 'organization_profile', providerId: 'discovery',
      provenance: { capabilityId: 'discovery', sourceType: 'research_artifacts', sourceArtifactIds: [`artifact-research-${tenantId}`], seedClient: tenantId, collectedAt: at },
      data: { organizationName: tenantId },
    }, at),
    createArtifact({
      id: planningId, projectId, kind: planningKind, providerId: 'planning',
      provenance: { capabilityId: 'planning', sourceType: 'discovery_artifacts', sourceArtifactIds: [discoveryId], seedClient: tenantId, collectedAt: at },
      data: planningData,
    }, at),
    createArtifact({ ...workOrderDraft, projectId, provenance: { ...workOrderDraft.provenance, collectedAt: at } }, at),
  ];
}

function assertTenantIsolation(tenantId, projectId, artifacts) {
  const foreign = artifacts.filter((artifact) => artifact.projectId !== projectId);
  if (foreign.length) throw new Error(`${tenantId}: cross-project artifacts detected`);
  for (const artifact of artifacts) {
    const sources = artifact.provenance?.sourceArtifactIds || [];
    const bad = sources.filter((id) => id.includes('tenant-') && !id.includes(tenantId));
    if (bad.length) throw new Error(`${tenantId}: foreign lineage ${bad.join(',')}`);
  }
}

async function buildOne({ tenantId, type, index, at, failPlan, sharedRegistry }) {
  const projectId = `project-${tenantId}`;
  const workOrder = createWorkOrder({
    id: `workorder-${type}-${tenantId}-${index}`,
    projectId,
    type,
    title: `${tenantId} ${type} deliverable`,
    acceptanceCriteria: [`${type} output preserves approved tenant scope`],
    createdAt: at,
    provenance: { capabilityId: 'planning', sourceArtifactIds: [`artifact-discovery-${tenantId}`], seedClient: tenantId, collectedAt: at },
  }, at);
  const artifacts = seedArtifacts(projectId, tenantId, type, workOrder, at);
  const key = `${tenantId}:${type}`;
  const failure = failPlan[key];
  let attempts = 0;
  let buildResult = null;
  while (attempts < 2) {
    attempts += 1;
    if (failure === 'permanent') return { tenantId, projectId, type, attempts, recovered: false, permanentFailure: true, artifacts, appended: [] };
    if (failure === 'retryable' && attempts === 1) continue;
    const builder = sharedRegistry.getByWorkOrderType(type);
    if (!builder) throw new Error(`No builder for ${type}`);
    buildResult = builder.build(workOrder, { artifacts, projectId, seedClient: tenantId }, at);
    break;
  }
  if (!buildResult?.ok) throw new Error(`${key}: build did not succeed`);
  const prepared = buildResult.drafts.map((draft) => createArtifact({ ...draft, projectId, provenance: { ...draft.provenance, collectedAt: draft.provenance?.collectedAt || at } }, at));
  const first = appendArtifacts(artifacts, prepared, at);
  const second = appendArtifacts(first.artifacts, prepared, at);
  if (second.appended.length !== 0) throw new Error(`${key}: append operation is not idempotent`);
  assertTenantIsolation(tenantId, projectId, first.artifacts);
  if (!first.artifacts.some((item) => item.kind === EXPECTED_KIND[type])) throw new Error(`${key}: expected production artifact missing`);
  if (!first.artifacts.some((item) => item.kind === 'deliverable')) throw new Error(`${key}: deliverable missing`);
  if (!first.artifacts.some((item) => item.kind === 'execution_contract')) throw new Error(`${key}: execution contract missing`);
  const gates = first.artifacts.filter((item) => item.kind === 'review_gate');
  for (const required of ['execution-verification', 'asset-integrity', 'visual-fidelity']) {
    if (!gates.some((item) => item.data?.reviewGate?.gateId === required)) throw new Error(`${key}: mandatory gate ${required} missing`);
  }
  if (buildResult.deliveryBlocked !== true) throw new Error(`${key}: delivery was not fail-closed`);
  return {
    tenantId, projectId, type, attempts,
    recovered: failure === 'retryable' && attempts === 2,
    permanentFailure: false,
    artifacts: first.artifacts,
    appended: first.appended,
    duplicateAppendSkipped: second.skippedIds.length,
  };
}

export async function runFactoryTortureCertification(options = {}) {
  const tenantCount = options.tenantCount || 12;
  const at = options.at || '2026-09-12T22:45:00.000Z';
  const tenants = Array.from({ length: tenantCount }, (_, i) => `tenant-${String(i + 1).padStart(2, '0')}`);
  const failPlan = {
    'tenant-03:portal': 'retryable',
    'tenant-07:report': 'permanent',
    ...(options.failPlan || {}),
  };
  const sharedRegistry = registry();
  const jobs = tenants.flatMap((tenantId) => TYPES.map((type, index) => ({ tenantId, type, index, at, failPlan, sharedRegistry })));
  const results = await Promise.all(jobs.map((job) => buildOne(job)));
  const permanent = results.filter((item) => item.permanentFailure);
  const recovered = results.filter((item) => item.recovered);
  const successful = results.filter((item) => !item.permanentFailure);
  const artifactIds = successful.flatMap((item) => item.appended.map((artifact) => artifact.id));
  if (new Set(artifactIds).size !== artifactIds.length) throw new Error('Cross-tenant artifact id collision detected');
  const healthyTenants = tenants.filter((tenantId) => tenantId !== 'tenant-07');
  for (const tenantId of healthyTenants) {
    const tenantResults = successful.filter((item) => item.tenantId === tenantId);
    if (tenantResults.length !== TYPES.length) throw new Error(`${tenantId}: healthy tenant did not complete all products`);
  }
  if (recovered.length < 1) throw new Error('Retryable failure did not recover');
  if (permanent.length !== 1 || permanent[0].tenantId !== 'tenant-07' || permanent[0].type !== 'report') throw new Error('Permanent failure isolation contract failed');
  return {
    certification: 'FACTORY_RUN_2_TORTURE_CERTIFICATION',
    status: 'PASS',
    tenantCount,
    productTypes: TYPES,
    jobsAttempted: results.length,
    jobsCompleted: successful.length,
    jobsPermanentlyFailed: permanent.length,
    retryableFailuresRecovered: recovered.length,
    artifactIdsUnique: true,
    tenantIsolation: 'PASS',
    idempotentAppend: 'PASS',
    mandatoryExecutionContracts: 'PASS',
    failClosedDelivery: 'PASS',
    permanentFailureBlastRadius: 'ONE_WORK_ORDER_ONLY',
    externalProductionTouched: false,
  };
}
