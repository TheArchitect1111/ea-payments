import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const manifestMod = await import(pathToFileURL(join(root, 'lib/factory-capability-manifest.mjs')).href);
const gatesMod = await import(pathToFileURL(join(root, 'lib/factory-capability-gates.mjs')).href);
const reviewMod = await import(pathToFileURL(join(root, 'lib/factory-review-gate.mjs')).href);

const { CAPABILITY_MANIFEST, listManifestCapabilityIds, validateManifest } = manifestMod;
const { qaCanRun, publishingCanRun, notificationCanRun } = gatesMod;
const { createReviewGate, reviewGateToArtifactDraft, listReviewGatesFromArtifacts } = reviewMod;

assert(validateManifest(CAPABILITY_MANIFEST).ok, 'Run 0 capability manifest must validate');
const ids = listManifestCapabilityIds(CAPABILITY_MANIFEST);
assert(ids.join('>') === 'intake>research>discovery>planning>production>qa>publishing>notification', 'Factory conveyor order must include Run 0 stages');

const base = {
  schemaVersion: 1,
  projectId: 'proj-run0-test',
  seed: { client: 'Run 0 Test', goal: 'Autonomous completion', deliverable: 'Website', attachments: [], source: 'api' },
  pipelineStatus: 'BUILDING',
  outputs: [
    { id: 'planning-1', kind: 'planning', worker: 'planning', createdAt: '2026-09-12T20:00:00Z', payload: {} },
    { id: 'production-1', kind: 'production', worker: 'production', createdAt: '2026-09-12T20:01:00Z', payload: { metrics: { workOrdersPending: 0 } } },
  ],
  artifacts: [
    { id: 'artifact-site', kind: 'website_site', data: {}, provenance: {} },
    { id: 'artifact-concepts', kind: 'experience_concepts', data: { recommendedConceptId: 'concept-a', concepts: [{ id: 'concept-a' }] }, provenance: {} },
    { id: 'artifact-deliverable', kind: 'deliverable', data: { deliverable: { schemaVersion: 1, id: 'deliverable-1', projectId: 'proj-run0-test', type: 'website', title: 'Website', status: 'ready_for_review', workOrderIds: ['wo-1'], artifactIds: ['artifact-site'], createdAt: '2026-09-12T20:01:00Z', provenance: { capabilityId: 'production', sourceType: 'work_order', sourceArtifactIds: ['artifact-site'], workOrderIds: ['wo-1'], collectedAt: '2026-09-12T20:01:00Z' }, payload: {} } }, provenance: {} },
  ],
};

assert(qaCanRun(base) === true, 'QA must run after production is complete');
assert(publishingCanRun(base) === false, 'Publishing must not run before QA');

const qaContext = {
  ...base,
  pipelineStatus: 'QA',
  outputs: [...base.outputs, { id: 'qa-1', kind: 'qa', worker: 'qa', createdAt: '2026-09-12T20:02:00Z', payload: { passed: true, reviewReady: true } }],
};
assert(publishingCanRun(qaContext) === true, 'Publishing must run only after passed QA');

const publishContext = {
  ...qaContext,
  pipelineStatus: 'UNDER_REVIEW',
  outputs: [...qaContext.outputs, { id: 'publishing-1', kind: 'publishing', worker: 'publishing', createdAt: '2026-09-12T20:03:00Z', payload: { verified: true, reviewReady: true, reviewUrl: 'https://efficiencyarchitects.online/preview/factory/proj-run0-test/concept-a' } }],
};
assert(notificationCanRun(publishContext) === true, 'Notification must run for a verified review-ready preview');

const oldGate = createReviewGate({
  id: 'reviewgate-website-content-1', projectId: 'proj-run0-test', gateId: 'website-content', title: 'Website content review', status: 'pending', required: true,
  provenance: { sourceArtifactIds: ['artifact-site'], collectedAt: '2026-09-12T20:01:00Z' },
}, '2026-09-12T20:01:00Z');
const newGate = createReviewGate({
  ...oldGate, status: 'passed', createdAt: '2026-09-12T20:02:00Z', provenance: { ...oldGate.provenance, capabilityId: 'qa', collectedAt: '2026-09-12T20:02:00Z' },
}, '2026-09-12T20:02:00Z');
const resolved = listReviewGatesFromArtifacts([
  { kind: 'review_gate', data: { reviewGate: oldGate } },
  { kind: 'review_gate', data: { reviewGate: newGate } },
]);
assert(resolved.length === 1 && resolved[0].status === 'passed', 'Append-only review gates must resolve to latest semantic state');
assert(reviewGateToArtifactDraft(newGate).provenance.capabilityId === 'qa', 'QA gate revision must retain QA provenance');

const paths = {
  qa: 'lib/factory-capabilities/qa-capability.ts',
  publishing: 'lib/factory-capabilities/publishing-capability.ts',
  notification: 'lib/factory-capabilities/notification-capability.ts',
  index: 'lib/factory-capabilities/index.ts',
  orchestrator: 'lib/factory-orchestrator.ts',
};
for (const [label, relative] of Object.entries(paths)) assert(existsSync(join(root, relative)), `missing ${label} implementation`);
const qaSource = readFileSync(join(root, paths.qa), 'utf8');
const publishingSource = readFileSync(join(root, paths.publishing), 'utf8');
const notificationSource = readFileSync(join(root, paths.notification), 'utf8');
const indexSource = readFileSync(join(root, paths.index), 'utf8');
const orchestratorSource = readFileSync(join(root, paths.orchestrator), 'utf8');

assert(qaSource.includes("'website-content', 'website-navigation'"), 'QA may auto-remediate structural gates only');
assert(!qaSource.includes("SYSTEM_VERIFIABLE_GATES = new Set(['experience-concept'"), 'QA must not auto-approve subjective experience concept');
assert(publishingSource.includes('/preview/factory/'), 'Publishing must emit canonical Factory preview route');
assert(publishingSource.includes('externalProductionPublish: false'), 'Run 0 must not auto-publish externally');
assert(notificationSource.includes('notifyFactoryDone'), 'Notification must reuse existing founder notification system');
for (const id of ['qaCapability','publishingCapability','notificationCapability']) assert(indexSource.includes(id), `registry missing ${id}`);
assert(orchestratorSource.includes("'QA'"), 'cron drain must recover QA stage');
assert(orchestratorSource.includes("'PUBLISHING'"), 'cron drain must recover Publishing stage');
assert(orchestratorSource.includes("item.kind === 'notification'"), 'UNDER_REVIEW must remain runnable until notification receipt exists');

if (failures.length) {
  console.error('FAIL factory Run 0 autonomous completion');
  for (const failure of failures) console.error(' -', failure);
  process.exit(1);
}
console.log('PASS factory Run 0 autonomous completion');
