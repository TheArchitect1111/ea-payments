import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mkdtempSync, readFileSync as read, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { classifyFailureDomain, discoverClients, evaluateCertification, evidenceFromBrowserGates, renderMarkdown, writeCertificationReports } from '../lib/launch-certification/engine.mjs';
import { resolveVercelPreview } from '../lib/launch-certification/vercel-preview.mjs';

const root = process.cwd();
const clients = JSON.parse(readFileSync(resolve(root, 'config/launch-certification/clients.json'), 'utf8'));
const capabilities = JSON.parse(readFileSync(resolve(root, 'config/launch-certification/capabilities.json'), 'utf8'));
const sourceCommit = 'a'.repeat(40);
const time = new Date('2026-10-29T17:00:00.000Z');

function completeEvidence(client, environment = 'preview', at = time.toISOString()) {
  return client.installedCapabilities.flatMap((capability) => capabilities.capabilities[capability].map((requirement) => ({
    checkId: `${capability}:${requirement}`,
    status: 'passed',
    sourceCommit,
    environment,
    timestamp: at,
    evidenceRef: `https://evidence.example/${client.id}/${capability}/${requirement}`,
  })));
}

function readyClient(id = 'tarris') {
  return { ...discoverClients(clients, id)[0], externalApprovals: [], liveVerificationRequired: [] };
}

test('discovers configured clients from one shared registry', () => {
  assert.deepEqual(discoverClients(clients).map((client) => client.id), ['tarris', 'amanda']);
  assert.equal(discoverClients(clients, 'tarris')[0].deployment.publicBaseUrl, 'https://tb3.online');
  assert.equal(discoverClients(clients, 'amanda')[0].sourceOfTruth[0], 'src/clients/amanda/chassis.config.ts');
  assert.throws(() => discoverClients(clients, 'missing'), /Unknown certification client/);
});

test('preview discovery binds the Vercel URL to the exact ready commit and project', async () => {
  const sourceCommit = 'c'.repeat(40);
  let requestedUrl;
  const result = await resolveVercelPreview({
    sourceCommit, token: 'test-token', projectId: 'prj_test', teamId: 'team_test', maxAttempts: 1,
    fetchImpl: async (url, options) => {
      requestedUrl = new URL(url);
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      return { ok: true, json: async () => ({ deployments: [
        { uid: 'wrong-sha', projectId: 'prj_test', state: 'READY', url: 'old.vercel.app', meta: { githubCommitSha: 'd'.repeat(40) } },
        { uid: 'exact', projectId: 'prj_test', state: 'READY', target: null, url: 'ea-payments-preview.vercel.app', meta: { githubCommitSha: sourceCommit } },
      ] }) };
    },
  });
  assert.equal(requestedUrl.searchParams.get('sha'), sourceCommit);
  assert.equal(requestedUrl.searchParams.get('projectId'), 'prj_test');
  assert.equal(requestedUrl.searchParams.get('target'), 'preview');
  assert.equal(result.url, 'https://ea-payments-preview.vercel.app');
  assert.equal(result.deploymentId, 'exact');
  assert.equal(result.sourceCommit, sourceCommit);
});

test('preview discovery rejects another project, production targets, and non-Vercel URLs', async () => {
  const sourceCommit = 'e'.repeat(40);
  const candidates = [
    { uid: 'wrong-project', projectId: 'other', state: 'READY', url: 'a.vercel.app', meta: { githubCommitSha: sourceCommit } },
    { uid: 'production', projectId: 'prj_test', state: 'READY', target: 'production', url: 'b.vercel.app', meta: { githubCommitSha: sourceCommit } },
    { uid: 'external-host', projectId: 'prj_test', state: 'READY', target: 'preview', url: 'example.com', meta: { githubCommitSha: sourceCommit } },
  ];
  await assert.rejects(resolveVercelPreview({
    sourceCommit, token: 'test-token', projectId: 'prj_test', teamId: 'team_test', maxAttempts: 1,
    fetchImpl: async () => ({ ok: true, json: async () => ({ deployments: candidates }) }),
  }), /Could not resolve a READY preview/);
  await assert.rejects(resolveVercelPreview({ sourceCommit, token: '', projectId: 'prj_test', teamId: 'team_test' }), /VERCEL_TOKEN/);
});

test('missing mandatory evidence blocks certification', () => {
  const record = evaluateCertification({ client: readyClient(), capabilityRegistry: capabilities, sourceCommit, runnerCommit: sourceCommit, environment: 'preview', now: time, root });
  assert.equal(record.decision, 'NOT CERTIFIED');
  assert.ok(record.checks.length > 0);
  assert.ok(record.checks.every((item) => item.status === 'missing'));
  assert.ok(record.failedRequirements.some((item) => item.type === 'missing'));
});

test('certification requires complete, fresh evidence bound to the same commit and environment', () => {
  const client = readyClient();
  const evidence = completeEvidence(client);
  const record = evaluateCertification({ client, capabilityRegistry: capabilities, evidence, sourceCommit, runnerCommit: sourceCommit, environment: 'preview', now: time, root });
  assert.equal(record.decision, 'CERTIFIED');
  assert.ok(record.checks.every((item) => item.status === 'passed' && item.evidence?.ref));

  const stale = evaluateCertification({ client, capabilityRegistry: capabilities, evidence: completeEvidence(client, 'preview', '2026-10-01T00:00:00.000Z'), sourceCommit, environment: 'preview', now: time, root });
  assert.equal(stale.decision, 'NOT CERTIFIED');
  assert.ok(stale.checks.some((item) => item.status === 'unverified' && /stale/.test(item.reason)));

  const wrongSource = completeEvidence(client).map((item) => ({ ...item, sourceCommit: 'b'.repeat(40) }));
  const mismatched = evaluateCertification({ client, capabilityRegistry: capabilities, evidence: wrongSource, sourceCommit, environment: 'preview', now: time, root });
  assert.ok(mismatched.checks.some((item) => item.status === 'unverified' && /source commit/.test(item.reason)));
  assert.equal(mismatched.decision, 'NOT CERTIFIED');
});

test('production certification requires deployment and critical-configuration identities', () => {
  const client = readyClient('amanda');
  const evidence = completeEvidence(client, 'production');
  const missingIdentity = evaluateCertification({ client, capabilityRegistry: capabilities, evidence, sourceCommit, environment: 'production', now: time, root });
  assert.equal(missingIdentity.decision, 'NOT CERTIFIED');
  assert.ok(missingIdentity.failedRequirements.some((item) => /configuration fingerprint/.test(item.reason)));
  const one = evaluateCertification({ client, capabilityRegistry: capabilities, evidence, sourceCommit, environment: 'production', deploymentId: 'deployment-a', configurationFingerprint: 'cfg-a', now: time, root });
  const two = evaluateCertification({ client, capabilityRegistry: capabilities, evidence, sourceCommit, environment: 'production', deploymentId: 'deployment-a', configurationFingerprint: 'cfg-b', now: time, root });
  assert.equal(one.decision, 'CERTIFIED');
  assert.notEqual(one.validity.bindingFingerprint, two.validity.bindingFingerprint);
});

test('external authorization and live integration gaps cannot be labeled as software failures or certification', () => {
  const client = discoverClients(clients, 'tarris')[0];
  const record = evaluateCertification({ client, capabilityRegistry: capabilities, sourceCommit, environment: 'production', now: time, root });
  assert.equal(record.decision, 'NOT CERTIFIED');
  assert.ok(record.outstandingExternalApprovals.some((item) => /Stripe/.test(item)));
  assert.ok(record.liveIntegrationsUnverified.some((item) => /Printful/.test(item)));
  assert.ok(record.failedRequirements.some((item) => item.type === 'pending-approval'));
});

test('Amanda uses the same engine and only her installed capability checks', () => {
  const client = discoverClients(clients, 'amanda')[0];
  const record = evaluateCertification({ client, capabilityRegistry: capabilities, sourceCommit, runnerCommit: sourceCommit, environment: 'preview', now: time, root });
  const expectedCount = client.installedCapabilities.reduce((sum, capability) => sum + capabilities.capabilities[capability].length, 0);
  assert.equal(record.decision, 'NOT CERTIFIED');
  assert.equal(record.checks.length, expectedCount);
  assert.equal(record.checks.some((item) => item.capability === 'instagram-commerce'), false);
  assert.equal(record.checks.some((item) => item.capability === 'portal'), true);
  assert.equal(record.client.id, 'amanda');
});

test('browser gate evidence covers only media and responsive checks for the exact deployment', () => {
  const client = readyClient();
  const gate = {
    target: 'https://tb3.online/tarris',
    previewUrl: 'https://tb3.online',
    sourceCommit,
    environment: 'preview',
    completedAt: time.toISOString(),
    evidenceRef: 'artifacts/ea-gate/tb3-public/gate-result.json',
    status: 'PASS',
    details: {},
    gates: {
      functional: { status: 'PASS' }, assets: { status: 'PASS' },
      desktopVisual: { status: 'PASS' }, mobileVisual: { status: 'PASS' },
    },
  };
  const browserEvidence = evidenceFromBrowserGates(client, [gate], { environment: 'preview', deploymentBaseUrl: 'https://tb3.online' });
  assert.deepEqual(browserEvidence.map((item) => item.checkId).sort(), ['website:media', 'website:responsive-ui']);
  const record = evaluateCertification({ client, capabilityRegistry: capabilities, evidence: browserEvidence, sourceCommit, environment: 'preview', now: time, root });
  assert.equal(record.deployment.baseUrl, null);
  assert.equal(evidenceFromBrowserGates(client, [gate], { environment: 'preview', deploymentBaseUrl: '' }).length, 0);
  assert.ok(record.checks.find((item) => item.checkId === 'website:responsive-ui').status === 'passed');
  assert.ok(record.checks.find((item) => item.checkId === 'website:media').status === 'passed');
  assert.equal(record.checks.find((item) => item.checkId === 'website:accessibility').status, 'missing');

  const localOnly = evidenceFromBrowserGates(client, [{ ...gate, previewUrl: 'http://127.0.0.1:3000', details: { certificationTransport: 'exact-built-checkout-local' } }], { environment: 'preview', deploymentBaseUrl: 'https://tb3.online' });
  assert.ok(localOnly.every((item) => item.status === 'unverified'));
  assert.equal(evidenceFromBrowserGates(client, [{ ...gate, target: 'https://other.example/tarris' }], { environment: 'preview', deploymentBaseUrl: 'https://tb3.online' }).length, 0);
  const localGateNotBoundToProduction = evidenceFromBrowserGates(client, [gate], { environment: 'preview', deploymentBaseUrl: '' });
  assert.equal(localGateNotBoundToProduction.length, 0);
});

test('failure domains route to concrete engineering disciplines', () => {
  assert.equal(classifyFailureDomain({ checkId: 'commerce:fulfillment' }), 'payments-commerce');
  assert.equal(classifyFailureDomain({ checkId: 'portal:tenant-isolation' }), 'authentication-security');
  assert.equal(classifyFailureDomain({ checkId: 'website:responsive-accessibility-seo-performance' }), 'frontend-ux');
  assert.equal(classifyFailureDomain({ checkId: 'operations:backup-recovery' }), 'database-data-integrity');
});

test('machine and human reports preserve blockers and deployment observations', () => {
  const client = readyClient();
  const record = evaluateCertification({ client, capabilityRegistry: capabilities, sourceCommit, environment: 'preview', now: time, root,
    observations: [{ route: '/tarris', status: 200, result: 'reachable; authenticated behavior not inferred' }] });
  const directory = mkdtempSync(resolve(tmpdir(), 'ea-launch-cert-'));
  try {
    const paths = writeCertificationReports(record, directory);
    const json = JSON.parse(read(paths.jsonPath, 'utf8'));
    const markdown = read(paths.markdownPath, 'utf8');
    assert.equal(json.decision, 'NOT CERTIFIED');
    assert.match(markdown, /## Blockers/);
    assert.match(markdown, /authenticated behavior not inferred/);
    assert.match(renderMarkdown(record), /source commit/i);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
