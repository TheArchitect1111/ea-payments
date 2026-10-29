import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const EVIDENCE_STATUSES = new Set(['passed', 'failed', 'pending-approval', 'unverified', 'missing']);
const SHA = /^[a-f0-9]{40}$/i;

export function discoverClients(clientRegistry, requested = 'all') {
  if (!clientRegistry || !Array.isArray(clientRegistry.clients)) throw new Error('Client registry must contain a clients array');
  const ids = new Set();
  for (const client of clientRegistry.clients) {
    if (!client || !/^[a-z0-9-]+$/.test(client.id || '') || ids.has(client.id)) throw new Error('Invalid or duplicate client ID');
    ids.add(client.id);
  }
  if (requested === 'all') return [...clientRegistry.clients];
  const found = clientRegistry.clients.find((client) => client.id === requested);
  if (!found) throw new Error(`Unknown certification client: ${requested}`);
  return [found];
}

export function validateClientManifest(client, capabilityRegistry, root = process.cwd()) {
  const errors = [];
  if (!client || !/^[a-z0-9-]+$/.test(client.id || '')) errors.push('invalid-client-id');
  const installed = client?.installedCapabilities;
  if (!Array.isArray(installed) || installed.length === 0) errors.push('installed-capabilities-missing');
  if (new Set(installed || []).size !== (installed || []).length) errors.push('duplicate-installed-capability');
  for (const capability of installed || []) {
    if (!Object.hasOwn(capabilityRegistry?.capabilities || {}, capability)) errors.push(`unknown-capability:${capability}`);
  }
  for (const sourcePath of client?.sourceOfTruth || []) {
    if (!existsSync(resolve(root, sourcePath))) errors.push(`missing-source-of-truth:${sourcePath}`);
  }
  if (!client?.deployment?.environment || !client?.deployment?.publicBaseUrl || !Array.isArray(client?.deployment?.routes)) {
    errors.push('deployment-identity-incomplete');
  } else {
    try { new URL(client.deployment.publicBaseUrl); } catch { errors.push('deployment-url-invalid'); }
    for (const route of client.deployment.routes) {
      if (!route || typeof route.path !== 'string' || !route.path.startsWith('/') || !installed?.includes(route.capability)) errors.push(`invalid-deployment-route:${route?.path || 'unknown'}`);
    }
  }
  return errors;
}

export function checkId(capability, requirement) {
  return `${capability}:${requirement}`;
}

export function evidenceFromBrowserGates(client, gateReports, { environment, deploymentBaseUrl }) {
  const expectedOrigin = (() => { try { return new URL(deploymentBaseUrl || client.deployment.publicBaseUrl).origin; } catch { return ''; } })();
  const reportsByCapability = new Map();
  for (const report of gateReports || []) {
    let target;
    let preview;
    try { target = new URL(report.target); preview = new URL(report.previewUrl); } catch { continue; }
    const route = client.deployment.routes.find((candidate) => candidate.path === target.pathname && candidate.capability && target.origin === expectedOrigin);
    if (!route) continue;
    const exactDeployment = preview.origin === expectedOrigin && report.environment === environment && report.sourceCommit && report.details?.certificationTransport !== 'exact-built-checkout-local';
    const ref = report.evidenceRef || `browser-gate:${target.toString()}:${report.completedAt || 'unknown'}`;
    const timestamp = report.completedAt;
    const rows = reportsByCapability.get(route.capability) || [];
    rows.push({ report, exactDeployment, ref, timestamp });
    reportsByCapability.set(route.capability, rows);
  }
  const evidence = [];
  for (const [capability, rows] of reportsByCapability) {
    const expectedRoutes = client.deployment.routes.filter((route) => route.capability === capability);
    const allRoutesHaveEvidence = rows.length === expectedRoutes.length && expectedRoutes.every((route) => rows.some((row) => new URL(row.report.target).pathname === route.path));
    if (!allRoutesHaveEvidence) continue;
    const exactDeployment = rows.every((row) => row.exactDeployment);
    const sourceCommits = new Set(rows.map((row) => row.report.sourceCommit));
    const sameSource = sourceCommits.size === 1;
    const all = (predicate) => rows.every((row) => predicate(row.report));
    const base = { sourceCommit: rows.at(-1).report.sourceCommit, environment, timestamp: rows.map((row) => row.timestamp).sort().at(-1), evidenceRef: rows.map((row) => row.ref).join(', ') };
    const status = (ok) => exactDeployment && sameSource ? (ok ? 'passed' : 'failed') : 'unverified';
    const reason = (ok) => exactDeployment && sameSource ? (ok ? '' : 'Existing browser gate reported a failed check') : 'Browser gate did not prove the exact requested deployment, source, and environment';
    evidence.push({ checkId: `${capability}:responsive-ui`, status: status(all((report) => report.status === 'PASS' && report.gates?.functional?.status === 'PASS' && report.gates?.desktopVisual?.status === 'PASS' && report.gates?.mobileVisual?.status === 'PASS')), reason: reason(all((report) => report.status === 'PASS' && report.gates?.functional?.status === 'PASS' && report.gates?.desktopVisual?.status === 'PASS' && report.gates?.mobileVisual?.status === 'PASS')), ...base });
    if (capability === 'website') evidence.push({ checkId: 'website:media', status: status(all((report) => report.gates?.assets?.status === 'PASS')), reason: reason(all((report) => report.gates?.assets?.status === 'PASS')), ...base });
  }
  return evidence;
}

export function evaluateCertification({ client, capabilityRegistry, evidence = [], sourceCommit, runnerCommit = null, environment, deploymentId = null, deploymentBaseUrl = null, configurationFingerprint = null, observations = [], now = new Date(), root = process.cwd() }) {
  const errors = validateClientManifest(client, capabilityRegistry, root);
  const observedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + Number(capabilityRegistry.evidenceMaxAgeHours || 168) * 3600000).toISOString();
  const evidenceByCheck = new Map();
  for (const item of evidence) {
    if (!item || typeof item.checkId !== 'string') continue;
    const rows = evidenceByCheck.get(item.checkId) || [];
    rows.push(item);
    evidenceByCheck.set(item.checkId, rows);
  }
  const explicitBlockers = new Set([
    ...(client.externalApprovals || []).map((name) => `approval:${name}`),
    ...(client.liveVerificationRequired || []).map((name) => `live:${name}`),
  ]);
  const checkResults = [];
  for (const capability of client.installedCapabilities || []) {
    for (const requirement of capabilityRegistry.capabilities[capability] || []) {
      const id = checkId(capability, requirement);
      const candidate = (evidenceByCheck.get(id) || []).at(-1);
      let status = candidate?.status || 'missing';
      let reason = candidate?.reason || (candidate ? '' : 'Mandatory evidence was not supplied');
      let validEvidence = null;
      if (!EVIDENCE_STATUSES.has(status)) {
        status = 'failed'; reason = 'Evidence status is not recognized';
      } else if (candidate) {
        const timestamp = Date.parse(candidate.timestamp || '');
        const ageLimit = Number(capabilityRegistry.evidenceMaxAgeHours || 168) * 3600000;
        if (!candidate.evidenceRef || !candidate.evidenceRef.trim()) { status = 'missing'; reason = 'Evidence reference is missing'; }
        else if (!SHA.test(sourceCommit || '') || candidate.sourceCommit !== sourceCommit) { status = 'unverified'; reason = 'Evidence is not bound to the requested source commit'; }
        else if (candidate.environment !== environment) { status = 'unverified'; reason = 'Evidence environment does not match this certification'; }
        else if (!Number.isFinite(timestamp) || timestamp > now.getTime() || now.getTime() - timestamp > ageLimit) { status = 'unverified'; reason = 'Evidence timestamp is invalid, future-dated, or stale'; }
        else if (status === 'passed') validEvidence = { ref: candidate.evidenceRef, timestamp: new Date(timestamp).toISOString(), sourceCommit, environment };
      }
      const lower = `${capability} ${requirement}`.toLowerCase();
      const approvalPending = [...explicitBlockers].some((blocker) => blocker.startsWith('approval:') && lower.includes('provider-authorization'));
      if (!candidate && approvalPending) { status = 'pending-approval'; reason = 'Provider authorization is an outstanding external approval'; }
      if (status === 'passed' && !validEvidence) { status = 'unverified'; reason = 'Evidence did not satisfy certification identity requirements'; }
      checkResults.push({ checkId: id, capability, requirement, mandatory: true, status, reason, evidence: validEvidence });
    }
  }
  const blockers = [
    ...errors.map((reason) => ({ type: 'manifest', reason })),
    ...checkResults.filter((check) => check.status !== 'passed').map((check) => ({ type: check.status, checkId: check.checkId, reason: check.reason })),
    ...(client.externalApprovals || []).map((name) => ({ type: 'pending-approval', owner: 'client/provider owner', reason: name })),
    ...(client.liveVerificationRequired || []).map((name) => ({ type: 'unverified-live', owner: 'client/provider owner', reason: name })),
  ];
  const targetBaseUrl = deploymentBaseUrl || client.deployment?.publicBaseUrl || 'unknown';
  const deploymentIdentity = `${environment || client.deployment?.environment || 'unknown'}:${targetBaseUrl}`;
  const canonical = JSON.stringify({ clientId: client.id, deploymentIdentity, deploymentId, sourceCommit, configurationFingerprint, capabilities: [...(client.installedCapabilities || [])].sort() });
  if (environment === 'production' && !configurationFingerprint) blockers.push({ type: 'missing', reason: 'Critical production configuration fingerprint is unavailable' });
  if (environment === 'production' && !deploymentId) blockers.push({ type: 'missing', reason: 'Production deployment identity is unavailable' });
  const decision = errors.length === 0 && checkResults.length > 0 && checkResults.every((check) => check.status === 'passed') && blockers.length === 0
    ? 'CERTIFIED'
    : 'NOT CERTIFIED';
  return {
    schemaVersion: 1,
    client: { id: client.id, displayName: client.displayName || client.id },
    deployment: { identity: deploymentIdentity, environment: environment || client.deployment?.environment || 'unknown', baseUrl: targetBaseUrl === 'unknown' ? null : targetBaseUrl },
    sourceCommit: sourceCommit || null,
    runnerCommit: runnerCommit || null,
    sourceIdentityValid: SHA.test(sourceCommit || ''),
    installedCapabilities: [...(client.installedCapabilities || [])],
    executedAt: observedAt,
    deploymentId,
    configurationFingerprint,
    validity: { validUntil: expiresAt, bindingFingerprint: createHash('sha256').update(canonical).digest('hex') },
    observations,
    checks: checkResults,
    failedRequirements: blockers,
    outstandingExternalApprovals: client.externalApprovals || [],
    liveIntegrationsUnverified: client.liveVerificationRequired || [],
    decision,
  };
}

export function classifyFailureDomain(failure) {
  const value = `${failure?.checkId || ''} ${failure?.reason || ''}`.toLowerCase();
  if (/payment|checkout|stripe|commerce|fulfillment|printful|refund/.test(value)) return 'payments-commerce';
  if (/auth|permission|tenant|secret|security|cross-tenant/.test(value)) return 'authentication-security';
  if (/database|persist|upload|data|backup|recovery/.test(value)) return 'database-data-integrity';
  if (/email|sms|notification|delivery/.test(value)) return 'communications-integrations';
  if (/api|provider|integration|sync|webhook/.test(value)) return 'backend-integrations';
  if (/monitor|deployment|operations|log/.test(value)) return 'infrastructure-operations';
  if (/responsive|accessibility|visual|navigation|website|media|form/.test(value)) return 'frontend-ux';
  return 'quality-assurance';
}

export function renderMarkdown(record) {
  const lines = [
    `# ${record.decision}: ${record.client.displayName}`,
    '',
    `- Deployment: ${record.deployment.identity}`,
    `- Source commit: ${record.sourceCommit || 'missing/invalid'}`,
    `- Executed: ${record.executedAt}`,
    `- Valid until: ${record.validity.validUntil}`,
    `- Installed capabilities: ${record.installedCapabilities.join(', ') || 'none'}`,
    '',
    '## Mandatory checks',
    '',
    '| Check | Result | Evidence |',
    '| --- | --- | --- |',
    ...record.checks.map((check) => `| ${check.checkId} | ${check.status}${check.reason ? `: ${check.reason.replaceAll('|', '\\|')}` : ''} | ${check.evidence?.ref || '—'} |`),
    '',
    '## Blockers',
    '',
    ...(record.failedRequirements.length ? record.failedRequirements.map((item) => `- ${item.type}${item.checkId ? ` (${item.checkId})` : ''}: ${item.reason}${item.owner ? ` — owner: ${item.owner}` : ''}`) : ['- None']),
    '',
    '## Read-only deployment observations',
    '',
    ...(record.observations.length ? record.observations.map((item) => `- ${item.route}: HTTP ${item.status} (${item.result})`) : ['- No live routes were observed']),
    '',
    '> Decision is fail-closed. This report does not activate commerce or authorize production changes.',
    '',
  ];
  return lines.join('\n');
}

export function writeCertificationReports(record, outputDirectory) {
  mkdirSync(outputDirectory, { recursive: true });
  const jsonPath = resolve(outputDirectory, `${record.client.id}.json`);
  const markdownPath = resolve(outputDirectory, `${record.client.id}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(record, null, 2)}\n`);
  writeFileSync(markdownPath, renderMarkdown(record));
  return { jsonPath, markdownPath };
}
