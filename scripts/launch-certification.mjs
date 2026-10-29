#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { discoverClients, evaluateCertification, evidenceFromBrowserGates, writeCertificationReports } from '../lib/launch-certification/engine.mjs';

const root = process.cwd();
const arg = (name, fallback = '') => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const registry = JSON.parse(readFileSync(resolve(root, 'config/launch-certification/clients.json'), 'utf8'));
const capabilityRegistry = JSON.parse(readFileSync(resolve(root, 'config/launch-certification/capabilities.json'), 'utf8'));
const clients = discoverClients(registry, arg('client', 'tarris'));
const environment = (arg('environment', process.env.EA_CERTIFICATION_ENVIRONMENT || 'production')).toLowerCase();
const baseUrlOverride = arg('base-url', process.env.EA_CERTIFICATION_BASE_URL || '');
const outputDirectory = resolve(root, arg('output', 'artifacts/launch-certification'));
const evidenceFile = arg('evidence-file', process.env.EA_CERTIFICATION_EVIDENCE_FILE || '');
const browserGateDirectory = resolve(root, arg('browser-gate-dir', 'artifacts/ea-gate'));
let runnerCommit = process.env.GITHUB_SHA || process.env.EA_SOURCE_COMMIT || '';
if (!runnerCommit) {
  try { runnerCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* manifest validation reports missing identity */ }
}

function readEvidenceRecords() {
  if (!evidenceFile) return [];
  const parsed = JSON.parse(readFileSync(resolve(root, evidenceFile), 'utf8'));
  const records = Array.isArray(parsed) ? parsed : parsed.records;
  if (!Array.isArray(records)) throw new Error('Evidence file must contain an array or { records: [] }');
  return records;
}

function readBrowserGateReports(directory) {
  if (!existsSync(directory)) return [];
  const reports = [];
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) reports.push(...readBrowserGateReports(path));
    else if (entry === 'gate-result.json') reports.push(JSON.parse(readFileSync(path, 'utf8')));
  }
  return reports;
}

const suppliedEvidence = readEvidenceRecords();
const browserGateReports = readBrowserGateReports(browserGateDirectory);
const previewBypassSecret = environment === 'preview' ? (process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '') : '';
const previewHeaders = previewBypassSecret ? { 'x-vercel-protection-bypass': previewBypassSecret } : {};

async function inspect(client) {
  const configuredBase = baseUrlOverride || (environment === 'production' ? client.deployment.publicBaseUrl : '');
  const base = configuredBase.replace(/\/$/, '');
  const observations = [];
  let buildInfo = null;
  if (!base) {
    observations.push({ route: '*', status: 0, result: `no ${environment} deployment URL was configured; no deployment was probed` });
  } else {
    try {
      const response = await fetch(`${base}/api/ops/build-info`, { headers: previewHeaders, cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (response.ok) buildInfo = await response.json();
    } catch (error) {
      observations.push({ route: '/api/ops/build-info', status: 0, result: `deployment identity unavailable: ${error instanceof Error ? error.message : String(error)}` });
    }
    for (const route of client.deployment.routes) {
      try {
        const response = await fetch(new URL(route.path, `${base}/`), { headers: previewHeaders, redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(20000) });
        const body = await response.text();
        const contentType = response.headers.get('content-type') || '';
        const routeUsable = response.status >= 200 && response.status < 400 && body.trim().length > 80 && contentType.includes('text/html');
        observations.push({ route: route.path, capability: route.capability, status: response.status, bodyBytes: Buffer.byteLength(body), contentType, result: routeUsable ? 'reachable with HTML response; route contents and authenticated behavior not inferred' : 'failed HTTP or HTML route check' });
      } catch (error) {
        observations.push({ route: route.path, capability: route.capability, status: 0, result: `request failed: ${error instanceof Error ? error.message : String(error)}` });
      }
    }
  }
  const deployedCommit = /^[a-f0-9]{40}$/i.test(buildInfo?.commitSha || '') ? buildInfo.commitSha : null;
  const environmentMatches = Boolean(buildInfo?.environment) && buildInfo.environment === environment;
  const routeObservations = observations.filter((item) => item.route !== '*');
  const publicRoutesReachable = Boolean(base) && routeObservations.length === client.deployment.routes.length && routeObservations.every((item) => item.result.startsWith('reachable with HTML'));
  const routeIdentityVerified = publicRoutesReachable && Boolean(deployedCommit) && environmentMatches;
  const evidence = client.installedCapabilities.includes('website') ? [{
    checkId: 'website:public-routes', status: routeIdentityVerified ? 'passed' : 'unverified',
    reason: routeIdentityVerified ? '' : 'Route response did not prove the requested deployment identity and environment',
    sourceCommit: deployedCommit || runnerCommit, environment,
    timestamp: new Date().toISOString(), evidenceRef: base ? `${client.deployment.routes.map((route) => `${base}${route.path}`).join(', ')}; build-info=${buildInfo?.commitSha || 'unavailable'}` : `deployment URL unavailable for ${environment}`,
  }] : [];
  return {
    sourceCommit: deployedCommit || runnerCommit,
    deploymentId: buildInfo?.deploymentId || (deployedCommit ? `${base}@${deployedCommit}` : null),
    configurationFingerprint: buildInfo?.criticalConfigurationFingerprint || process.env.EA_CRITICAL_CONFIG_FINGERPRINT || null,
    observations,
    evidence,
    buildInfo,
  };
}

let failed = false;
for (const client of clients) {
  const live = await inspect(client);
  const deploymentBaseUrl = baseUrlOverride || (environment === 'production' ? client.deployment.publicBaseUrl : '');
  const browserEvidence = evidenceFromBrowserGates(client, browserGateReports, { environment, deploymentBaseUrl });
  const record = evaluateCertification({
    client, capabilityRegistry, evidence: [...suppliedEvidence, ...browserEvidence, ...live.evidence],
    sourceCommit: live.sourceCommit, runnerCommit,
    environment,
    deploymentId: live.deploymentId,
    deploymentBaseUrl: deploymentBaseUrl || null,
    configurationFingerprint: live.configurationFingerprint,
    observations: live.observations,
    root,
  });
  const files = writeCertificationReports(record, outputDirectory);
  console.log(JSON.stringify({ client: client.id, decision: record.decision, sourceCommit: record.sourceCommit, checksPassed: record.checks.filter((item) => item.status === 'passed').length, checksTotal: record.checks.length, blockers: record.failedRequirements.length, report: files }, null, 2));
  if (record.decision !== 'CERTIFIED') process.exitCode = 1;
}
