import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mkdtempSync, readFileSync as read, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { classifyFailureDomain, discoverClients, evaluateCertification, evidenceFromBrowserGates, renderMarkdown, validateClientManifest, verifyCertificateBinding, writeCertificationReports } from '../lib/launch-certification/engine.mjs';
import { previewUrlFromCheckRuns, resolveGithubPreview } from '../lib/launch-certification/github-preview-check.mjs';

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
  for (const client of clients.clients) {
    const portalRoute = client.deployment.routes.find((route) => route.capability === 'portal');
    assert.equal(client.unauthenticatedAccessProbe?.route, portalRoute?.path, `${client.id} must configure an unauthenticated portal probe`);
    assert.ok(client.unauthenticatedAccessProbe.deniedPath);
    assert.deepEqual(validateClientManifest({ ...client, deployment: { ...client.deployment, publicBaseUrl: 'http://insecure.example' } }, capabilities, root).filter((error) => error === 'production-deployment-url-must-use-https').length, 1);
  }
});

test('preview discovery reads a successful Vercel check bound to the exact source commit', async () => {
  const sourceCommit = 'c'.repeat(40);
  const requestedUrls = [];
  const result = await resolveGithubPreview({
    sourceCommit, repository: 'TheArchitect1111/ea-payments', token: 'test-token', maxAttempts: 1,
    fetchImpl: async (url, options) => {
      const requestedUrl = new URL(url);
      requestedUrls.push(requestedUrl);
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      if (requestedUrl.pathname.endsWith('/status')) return { ok: true, json: async () => ({ statuses: [
        { context: 'Vercel', state: 'success', updated_at: '2026-10-29T17:01:00Z' },
      ] }) };
      return { ok: true, json: async () => ({ check_runs: [
        { name: 'Vercel Preview Comments', head_sha: 'd'.repeat(40), status: 'completed', conclusion: 'success', output: { summary: 'https://vercel.live/open-feedback/ea-payments-other-the-architects-projects-cc813778.vercel.app' } },
        { name: 'Vercel Preview Comments', head_sha: sourceCommit, status: 'in_progress', conclusion: null, output: { summary: 'https://vercel.live/open-feedback/ea-payments-pending-the-architects-projects-cc813778.vercel.app' } },
        { name: 'Vercel Preview Comments', head_sha: sourceCommit, status: 'completed', conclusion: 'success', output: { summary: '✅ Preview ready. [Go to feedback](https://vercel.live/open-feedback/ea-payments-preview-the-architects-projects-cc813778.vercel.app?via=pr-comment-feedback-link)' } },
      ] }) };
    },
  });
  assert.ok(requestedUrls.some((url) => url.pathname === `/repos/TheArchitect1111/ea-payments/commits/${sourceCommit}/check-runs` && url.searchParams.get('per_page') === '100'));
  assert.ok(requestedUrls.some((url) => url.pathname === `/repos/TheArchitect1111/ea-payments/commits/${sourceCommit}/status`));
  assert.equal(result.url, 'https://ea-payments-preview-the-architects-projects-cc813778.vercel.app');
  assert.equal(result.sourceCommit, sourceCommit);
});

test('preview discovery rejects wrong commits, failed checks, and untrusted hosts', () => {
  const sourceCommit = 'e'.repeat(40);
  const check = (head_sha, conclusion, host) => ({ name: 'Vercel Preview Comments', head_sha, status: 'completed', conclusion, output: { summary: `https://vercel.live/open-feedback/${host}` } });
  const checks = [
    check('f'.repeat(40), 'success', 'ea-payments-other-the-architects-projects-cc813778.vercel.app'),
    check(sourceCommit, 'failure', 'ea-payments-failed-the-architects-projects-cc813778.vercel.app'),
    check(sourceCommit, 'success', 'example.com'),
  ];
  assert.equal(previewUrlFromCheckRuns(checks, [{ context: 'Vercel', state: 'success' }], sourceCommit), null);
  assert.equal(previewUrlFromCheckRuns([
    check(sourceCommit, 'success', 'ea-payments-ready-the-architects-projects-cc813778.vercel.app'),
  ], [{ context: 'Vercel', state: 'pending' }], sourceCommit), null);
  assert.equal(previewUrlFromCheckRuns([
    check(sourceCommit, 'success', 'ea-payments-ready-the-architects-projects-cc813778.vercel.app'),
  ], [
    { context: 'Vercel', state: 'success', updated_at: '2026-10-29T17:00:00Z' },
    { context: 'Vercel', state: 'pending', updated_at: '2026-10-29T17:01:00Z' },
  ], sourceCommit), null);
});

test('preview resolver rejects absent or malformed source identity and check evidence', async () => {
  await assert.rejects(resolveGithubPreview({ sourceCommit: 'bad', repository: 'TheArchitect1111/ea-payments', token: 'test-token' }), /full 40-character/);
  await assert.rejects(resolveGithubPreview({ sourceCommit: 'e'.repeat(40), repository: '', token: 'test-token' }), /GITHUB_REPOSITORY/);
  await assert.rejects(resolveGithubPreview({ sourceCommit: 'e'.repeat(40), repository: 'TheArchitect1111/ea-payments', token: 'test-token', maxAttempts: 1,
    fetchImpl: async (url) => ({ ok: true, json: async () => new URL(url).pathname.endsWith('/status') ? { statuses: [] } : { check_runs: [] } }),
  }), /Could not resolve a successful/);
  await assert.rejects(resolveGithubPreview({ sourceCommit: 'e'.repeat(40), repository: 'TheArchitect1111/ea-payments', token: 'test-token', maxAttempts: 1,
    fetchImpl: async (url) => ({ ok: true, json: async () => new URL(url).pathname.endsWith('/status') ? { statuses: [{ context: 'Vercel', state: 'failure', description: 'Build failed' }] } : { check_runs: [] } }),
  }), /Vercel deployment failed/);
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
  const record = evaluateCertification({ client, capabilityRegistry: capabilities, evidence, sourceCommit, runnerCommit: sourceCommit, environment: 'preview', deploymentId: 'preview-deployment-a', deploymentBaseUrl: 'https://preview.example', now: time, root });
  assert.equal(record.decision, 'CERTIFIED');
  assert.ok(record.checks.every((item) => item.status === 'passed' && item.evidence?.ref));

  const stale = evaluateCertification({ client, capabilityRegistry: capabilities, evidence: completeEvidence(client, 'preview', '2026-10-01T00:00:00.000Z'), sourceCommit, environment: 'preview', now: time, root });
  assert.equal(stale.decision, 'NOT CERTIFIED');
  assert.ok(stale.checks.some((item) => item.status === 'unverified' && /stale/.test(item.reason)));
  const staleWithEvidence = stale.checks.find((item) => item.status === 'unverified' && /stale/.test(item.reason));
  assert.match(staleWithEvidence.evidence.ref, /evidence\.example/);
  assert.match(staleWithEvidence.evidence.verificationReason, /stale/);

  const wrongSource = completeEvidence(client).map((item) => ({ ...item, sourceCommit: 'b'.repeat(40) }));
  const mismatched = evaluateCertification({ client, capabilityRegistry: capabilities, evidence: wrongSource, sourceCommit, environment: 'preview', now: time, root });
  assert.ok(mismatched.checks.some((item) => item.status === 'unverified' && /source commit/.test(item.reason)));
  assert.equal(mismatched.decision, 'NOT CERTIFIED');
});

test('production certification requires deployment and critical-configuration identities', () => {
  const client = readyClient('amanda');
  const evidence = completeEvidence(client, 'production');
  const missingIdentity = evaluateCertification({ client, capabilityRegistry: capabilities, evidence, sourceCommit, environment: 'production', deploymentBaseUrl: client.deployment.publicBaseUrl, now: time, root });
  assert.equal(missingIdentity.decision, 'NOT CERTIFIED');
  assert.ok(missingIdentity.failedRequirements.some((item) => /configuration fingerprint/.test(item.reason)));
  const fingerprintA = 'a'.repeat(64);
  const fingerprintB = 'b'.repeat(64);
  const one = evaluateCertification({ client, capabilityRegistry: capabilities, evidence, sourceCommit, environment: 'production', deploymentId: 'deployment-a', deploymentBaseUrl: client.deployment.publicBaseUrl, configurationFingerprint: fingerprintA, now: time, root });
  const two = evaluateCertification({ client, capabilityRegistry: capabilities, evidence, sourceCommit, environment: 'production', deploymentId: 'deployment-a', deploymentBaseUrl: client.deployment.publicBaseUrl, configurationFingerprint: fingerprintB, now: time, root });
  assert.equal(one.decision, 'CERTIFIED');
  assert.notEqual(one.validity.bindingFingerprint, two.validity.bindingFingerprint);
  const binding = {
    clientId: one.client.id,
    deploymentIdentity: one.deployment.identity,
    deploymentId: one.deploymentId,
    sourceCommit: one.sourceCommit,
    configurationFingerprint: fingerprintA,
    capabilities: one.installedCapabilities,
  };
  assert.deepEqual(verifyCertificateBinding(one, binding, time), { valid: true, status: 'valid', reason: '' });
  assert.equal(verifyCertificateBinding(one, { ...binding, deploymentId: 'deployment-b' }, time).status, 'invalidated');
  assert.equal(verifyCertificateBinding(one, { ...binding, configurationFingerprint: fingerprintB }, time).status, 'invalidated');
  assert.equal(verifyCertificateBinding(one, binding, new Date('2026-11-06T18:00:00.000Z')).status, 'expired');
  const invalidFingerprint = evaluateCertification({ client, capabilityRegistry: capabilities, evidence, sourceCommit, environment: 'production', deploymentId: 'deployment-a', deploymentBaseUrl: client.deployment.publicBaseUrl, configurationFingerprint: 'not-a-fingerprint', now: time, root });
  assert.equal(invalidFingerprint.decision, 'NOT CERTIFIED');
  assert.ok(invalidFingerprint.failedRequirements.some((item) => /fingerprint is unavailable or invalid/.test(item.reason)));
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
    details: { desktop: { finalUrl: 'https://tb3.online/tarris' }, mobile: { finalUrl: 'https://tb3.online/tarris' } },
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

  const redirectedPortal = evidenceFromBrowserGates(client, [{
    ...gate,
    target: 'https://tb3.online/tarris/future',
    details: { desktop: { finalUrl: 'https://tb3.online/tarris?hq=private' }, mobile: { finalUrl: 'https://tb3.online/tarris?hq=private' } },
  }], { environment: 'preview', deploymentBaseUrl: 'https://tb3.online' });
  assert.ok(redirectedPortal.every((item) => item.status === 'unverified' && /redirect away/.test(item.reason)));

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
    testsExecuted: [{ name: 'full-repository-suite', result: 'success', executedAt: time.toISOString() }],
    observations: [{ route: '/tarris', status: 200, result: 'reachable; authenticated behavior not inferred' }] });
  const directory = mkdtempSync(resolve(tmpdir(), 'ea-launch-cert-'));
  try {
    const paths = writeCertificationReports(record, directory);
    const json = JSON.parse(read(paths.jsonPath, 'utf8'));
    const markdown = read(paths.markdownPath, 'utf8');
    assert.equal(json.decision, 'NOT CERTIFIED');
    assert.equal(json.testsExecuted[0].result, 'success');
    assert.match(markdown, /## Blockers/);
    assert.match(markdown, /full-repository-suite: success/);
    assert.match(markdown, /authenticated behavior not inferred/);
    assert.match(renderMarkdown(record), /source commit/i);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
