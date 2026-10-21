#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const inventory = JSON.parse(readFileSync(join(root, 'config/capability-inventory.json'), 'utf8'));
const contract = JSON.parse(readFileSync(join(root, 'config/module-certification-contract.json'), 'utf8'));
const ledger = JSON.parse(readFileSync(join(root, 'config/module-certification-evidence.json'), 'utf8'));
const registrySource = readFileSync(join(root, 'lib/modules/registry.ts'), 'utf8');
const syncMetadata = JSON.parse(readFileSync(join(root, 'vendor/.platform-sync-meta.json'), 'utf8'));
const registryMatch = registrySource.match(/export const MODULE_IDS = \[([\s\S]*?)\] as const;/);
const registryIds = registryMatch ? [...registryMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]) : [];
const inventoryIds = inventory.modules.map((module) => module.id);
const certifiedModules = inventory.modules.filter((module) => module.assemblyStatus === 'certified');
const certificates = ledger.certificates ?? [];
const certificatesById = new Map(certificates.map((certificate) => [certificate.moduleId, certificate]));
const requiredClasses = contract.requiredEvidenceClasses ?? [];
const failures = [];
const uniqueTests = new Set();
for (const certificate of certificates) {
  for (const evidence of Object.values(certificate.evidence ?? {})) {
    for (const test of evidence.tests ?? []) uniqueTests.add(test);
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function hashRows(rows) {
  const hash = createHash('sha256');
  for (const row of [...rows].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(row.path);
    hash.update('\0');
    hash.update(row.hash);
    hash.update('\0');
  }
  return hash.digest('hex');
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

function setDifference(left, right) {
  const rightSet = new Set(right);
  return left.filter((value) => !rightSet.has(value)).sort();
}

const sourceCommit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/i.test(sourceCommit)) failures.push('source-commit:invalid');

if (!registryMatch) failures.push('registry:unable-to-read-MODULE_IDS');
if (duplicates(registryIds).length) failures.push('registry:duplicate-ids:' + duplicates(registryIds).join(','));
if (duplicates(inventoryIds).length) failures.push('inventory:duplicate-ids:' + duplicates(inventoryIds).join(','));
if (duplicates(certificates.map((certificate) => certificate.moduleId)).length) {
  failures.push('certificates:duplicate-ids:' + duplicates(certificates.map((certificate) => certificate.moduleId)).join(','));
}
for (const id of setDifference(registryIds, inventoryIds)) failures.push('registry-missing-inventory:' + id);
for (const id of setDifference(inventoryIds, registryIds)) failures.push('inventory-missing-registry:' + id);
for (const id of setDifference(certifiedModules.map((module) => module.id), certificates.map((certificate) => certificate.moduleId))) {
  failures.push('certified-module-missing-certificate:' + id);
}

const trackedPaths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((path) =>
    /^(app|lib|src|vendor)\//.test(path) ||
    ['config/capability-inventory.json', 'config/module-certification-contract.json'].includes(path),
  )
  .filter((path) => /\.(?:c|m)?(?:js|jsx|ts|tsx|json|css)$/.test(path));
const sourceRows = trackedPaths.map((path) => ({
  path: path.split(sep).join('/'),
  hash: sha256(readFileSync(join(root, path))),
}));
const sourceTreeFingerprint = hashRows(sourceRows);

const testResults = {};
for (const path of [...uniqueTests].sort()) {
  if (!existsSync(join(root, path))) {
    testResults[path] = { status: 'missing-file', exitCode: null, sourceHash: null, outputFingerprint: null };
    continue;
  }
  const sourceHash = sha256(readFileSync(join(root, path)));
  const args = /\.(?:ts|tsx|mts|cts)$/.test(path)
    ? ['--import', 'tsx', path]
    : [path];
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 2 * 1024 * 1024,
    env: process.env,
  });
  const output = (result.stdout ?? '') + '\n' + (result.stderr ?? '');
  testResults[path] = {
    status: result.error ? 'runner-error' : result.status === 0 ? 'passed' : 'failed',
    exitCode: result.status ?? null,
    signal: result.signal ?? null,
    durationMs: Date.now() - startedAt,
    sourceHash,
    outputFingerprint: sha256(output),
    errorCode: result.error?.code ?? null,
  };
}

const allTestFilesPassed = Object.values(testResults).every((result) => result.status === 'passed');
if (!allTestFilesPassed) failures.push('evidence-tests:not-all-passed');

const modules = certifiedModules.map((module) => {
  const certificate = certificatesById.get(module.id);
  const moduleTests = new Set();
  const classBindings = {};
  for (const evidenceClass of requiredClasses) {
    const paths = certificate?.evidence?.[evidenceClass]?.tests ?? [];
    classBindings[evidenceClass] = paths.map((path) => ({
      path,
      status: testResults[path]?.status ?? (existsSync(join(root, path)) ? 'not-run' : 'missing-file'),
    }));
    for (const path of paths) moduleTests.add(path);
  }

  const moduleTestResults = [...moduleTests].sort().map((path) => ({ path, ...(testResults[path] ?? { status: 'missing-file' }) }));
  const evidenceByClassIsExplicit =
    certificate?.evidenceClassTests &&
    requiredClasses.every((evidenceClass) => Array.isArray(certificate.evidenceClassTests[evidenceClass]) &&
      certificate.evidenceClassTests[evidenceClass].length > 0);
  const moduleSourceFingerprint = sha256(JSON.stringify({
    module,
    sourceTreeFingerprint,
    packageHashes: syncMetadata.packageHashes,
  }));
  const evidenceFingerprint = sha256(JSON.stringify({
    requiredClasses,
    classBindings,
    tests: moduleTestResults.map(({ path, status, exitCode, sourceHash, outputFingerprint }) =>
      ({ path, status, exitCode, sourceHash, outputFingerprint })),
  }));
  const blockers = [];
  if (!certificate) blockers.push('missing-certificate');
  if (certificate?.status !== 'certified') blockers.push('certificate-status-not-certified');
  if (certificate?.moduleVersion !== module.version) blockers.push('module-version-mismatch');
  if (!/^[a-f0-9]{40}$/i.test(certificate?.sourceCommit ?? '')) blockers.push('missing-or-invalid-source-commit');
  if (certificate?.sourceCommit !== sourceCommit) blockers.push('source-commit-mismatch');
  if (!/^[a-f0-9]{64}$/i.test(certificate?.sourceFingerprint ?? '')) blockers.push('missing-or-placeholder-source-fingerprint');
  if (certificate?.sourceFingerprint !== moduleSourceFingerprint) blockers.push('source-fingerprint-mismatch');
  if (!/^[a-f0-9]{64}$/i.test(certificate?.evidenceFingerprint ?? '')) blockers.push('missing-or-placeholder-evidence-fingerprint');
  if (certificate?.evidenceFingerprint !== evidenceFingerprint) blockers.push('evidence-fingerprint-mismatch');
  if (!evidenceByClassIsExplicit) blockers.push('missing-class-specific-test-mapping');
  if (moduleTestResults.some((result) => result.status !== 'passed')) blockers.push('module-evidence-test-failed');

  return {
    moduleId: module.id,
    moduleVersion: module.version,
    assemblyStatus: module.assemblyStatus,
    legacyCertificateStatus: certificate?.status ?? 'missing',
    sourceFingerprint: moduleSourceFingerprint,
    evidenceFingerprint,
    evidenceClasses: Object.fromEntries(requiredClasses.map((evidenceClass) => [
      evidenceClass,
      {
        testCount: classBindings[evidenceClass].length,
        results: classBindings[evidenceClass],
        explicitMapping: Array.isArray(certificate?.evidenceClassTests?.[evidenceClass]),
      },
    ])),
    testResults: moduleTestResults,
    status: blockers.length ? 'BLOCKED' : 'CERTIFIED',
    blockers,
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  workflow: {
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    event: process.env.GITHUB_EVENT_NAME ?? 'local',
  },
  source: {
    repository: process.env.GITHUB_REPOSITORY ?? 'TheArchitect1111/ea-payments',
    commit: sourceCommit,
    branch: process.env.GITHUB_REF_NAME ?? null,
    dirty: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
    sourceTreeFingerprint,
    sourceFileCount: sourceRows.length,
  },
  platformPackages: {
    repository: syncMetadata.source.repository,
    sourceCommit: syncMetadata.source.commit,
    packageHashes: syncMetadata.packageHashes,
  },
  moduleIds: {
    registryCount: registryIds.length,
    inventoryCount: inventoryIds.length,
    certifiedInventoryCount: certifiedModules.length,
    certificateCount: certificates.length,
    registryMissingInventory: setDifference(registryIds, inventoryIds),
    inventoryMissingRegistry: setDifference(inventoryIds, registryIds),
  },
  testSummary: {
    uniqueFiles: Object.keys(testResults).length,
    passed: Object.values(testResults).filter((result) => result.status === 'passed').length,
    failed: Object.values(testResults).filter((result) => result.status === 'failed' || result.status === 'runner-error').length,
    missing: Object.values(testResults).filter((result) => result.status === 'missing-file').length,
  },
  modules,
  status: modules.every((module) => module.status === 'CERTIFIED') && failures.length === 0 ? 'PASS' : 'BLOCKED',
  failures,
};

const outputPath = join(root, 'artifacts/lego-certification/latest.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  status: report.status,
  sourceCommit,
  modules: modules.length,
  certified: modules.filter((module) => module.status === 'CERTIFIED').length,
  blocked: modules.filter((module) => module.status === 'BLOCKED').length,
  tests: report.testSummary,
  reportPath: relative(root, outputPath),
}, null, 2));

if (process.argv.includes('--strict') && report.status !== 'PASS') process.exit(1);
