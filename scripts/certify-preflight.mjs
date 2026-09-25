import { readFileSync, readdirSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));
const failures = [];
const warnings = [];
const pass = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);

const guardrails = json('config/release-guardrails.json');
const protection = json('config/production-protection.json');
const inventory = json('config/capability-inventory.json');
const certifications = json('config/capability-certifications.json'); // historical evidence ledger only
const ci = read('.github/workflows/ci.yml');
const registry = read('lib/modules/registry.ts');

const cert = new Map(certifications.certifications.map((x) => [x.id, x]));
const inv = new Map(inventory.modules.map((x) => [x.id, x]));

for (const gate of guardrails.requiredGates) {
  const evidence = {
    'system-registry': 'test-system-registry.mjs',
    'production-protection': 'test-production-protection.mjs',
    'tenant-safety': 'test-tenant-release-safety.mjs',
    'release-guardrails': 'test-release-guardrails.mjs',
    'recovery': 'test-recovery-journeys.mjs',
    'customer-journey-smoke': 'npm run verify:deploy',
  }[gate];
  if (evidence && !ci.includes(evidence)) fail(`universal guardrail missing from CI: ${gate} -> ${evidence}`);
}
pass.push('release guardrails mapped before CI execution');

for (const [id, c] of cert) {
  const i = inv.get(id);
  if (!i) fail(`historically certified module missing canonical inventory record: ${id}`);
  else if (i.assemblyStatus !== 'certified') fail(`CERTIFICATION_DRIFT ${id}: canonical inventory=${i.assemblyStatus}, historical evidence=certified`);
}
pass.push('inventory/certification drift evaluated in one sweep');

const preset = registry.match(/'ea-client': \[([\s\S]*?)\n  \],/);
if (preset) {
  const ids = [...preset[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const id of ids) {
    const i = inv.get(id);
    const effectiveCertified = i?.assemblyStatus === 'certified';
    if (!effectiveCertified) fail(`DEFAULT_PRESET_UNCERTIFIED ${id}`);
  }
}
pass.push('default tenant preset checked against effective certification');

for (const client of protection.clients) {
  if (!client.id || !client.sourceContracts?.length) fail('protected client missing identity/source contract');
}
pass.push(`${protection.clients.length} protected surfaces have source contracts`);

const amanda = json('clients/amanda-catherine/client.json');
const amandaProtection = protection.clients.find((x) => x.id === amanda.id);
if (!amandaProtection) fail('Amanda client manifest has no production protection profile');
if (amanda.canonical.sourceBranch !== 'master') fail('Amanda canonical source must be master');
if (!amanda.legacy?.retiredVercelProjects?.length) warn('Amanda retired deployment list is empty');
pass.push('Amanda canonical/legacy boundary evaluated');

const workflowNames = readdirSync('.github/workflows').filter((x) => x.endsWith('.yml') || x.endsWith('.yaml'));
const amandaRecovery = workflowNames.filter((x) => x.startsWith('amanda-') && /recover|recovery|preflight/.test(x));
for (const workflow of amandaRecovery) {
  const body = read(`.github/workflows/${workflow}`);
  if (!body.startsWith('# QUARANTINED:') || /\n\s*push:/.test(body)) fail(`HISTORICAL_AUTOMATION_ACTIVE ${workflow}`);
}
if (amandaRecovery.length) pass.push(`${amandaRecovery.length} Amanda historical workflows are quarantined/manual-only`);

const report = {
  version: 1,
  target: process.argv[2] || 'repository',
  result: failures.length ? 'BLOCKED' : 'PASS_WITH_FINDINGS',
  failures,
  warnings,
  passedChecks: pass,
  summary: { failures: failures.length, warnings: warnings.length, checks: pass.length },
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
