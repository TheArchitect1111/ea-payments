import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const workflow = readFileSync('.github/workflows/ea-master-guard.yml', 'utf8');
const promotionVerifier = readFileSync('scripts/verify-master-promotion.mjs', 'utf8');
const vercelIgnore = readFileSync('scripts/vercel-ignore-work-branches.mjs', 'utf8');
const productionVerifier = readFileSync('scripts/verify-production-gate.mjs', 'utf8');

for (const needle of [
  'branches: [master]',
  'pull-requests: read',
  'Unauthorized direct push detected.',
  'Revert unauthorized direct push',
  'git push origin HEAD:master',
  'commits/$SHA/pulls',
  'EA-GATED',
]) {
  assert(workflow.includes(needle), `master guard workflow missing: ${needle}`);
}

for (const needle of [
  "manifest.sourceCommit !== parentSha",
  ".ea/gates/latest.json",
  "manifest.status !== 'PASS'",
]) {
  assert(promotionVerifier.includes(needle), `promotion verifier missing: ${needle}`);
}

assert(vercelIgnore.includes("branch === 'master' && target === 'production'"), 'Vercel production master gate missing');
assert(vercelIgnore.includes('verify-production-gate.mjs'), 'Vercel production gate verifier missing');
assert(vercelIgnore.includes('isApprovedTb3SandboxCheckoutPreviewRevision'), 'TB3 Sandbox checkout Preview exception missing');
assert(vercelIgnore.includes('isApprovedTb3NoPayeeDiagnosticPreviewRevision'), 'TB3 no-payee diagnostic Preview exception missing');
assert(vercelIgnore.includes('isApprovedTb3SandboxOrderReadDiagnosticPreviewRevision'), 'TB3 order-read diagnostic Preview exception missing');
assert(vercelIgnore.includes('isApprovedTb3SandboxOrderReadDiagnosticCleanupPreviewRevision'), 'TB3 order-read diagnostic cleanup Preview exception missing');
assert(vercelIgnore.includes('isApprovedTb3SandboxRecoveryPreviewRevision'), 'TB3 Sandbox recovery Preview exception missing');
assert(productionVerifier.includes("changedFiles.filter((file) => !allowed.has(file))"), 'production gate must reject non-manifest files');

const runIgnoreGuard = (branch, commit, target, vercelEnv = '') => spawnSync(
  process.execPath,
  ['scripts/vercel-ignore-work-branches.mjs'],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      VERCEL_GIT_COMMIT_REF: branch,
      VERCEL_GIT_COMMIT_SHA: commit,
      VERCEL_TARGET_ENV: target,
      VERCEL_ENV: vercelEnv,
    },
  },
);

const finalShaResult = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
assert.equal(finalShaResult.status, 0, 'final candidate commit must be available locally');
const finalSha = finalShaResult.stdout.trim();
const parentShaResult = spawnSync('git', ['rev-parse', `${finalSha}^`], { encoding: 'utf8' });
assert.equal(parentShaResult.status, 0, 'final candidate must have a parent');
const finalParentSha = parentShaResult.stdout.trim();
const changedFilesResult = spawnSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', finalSha], { encoding: 'utf8' });
assert.equal(changedFilesResult.status, 0, 'final candidate change list must be available');
const finalChangedFiles = changedFilesResult.stdout.trim().split(/\r?\n/).filter(Boolean).sort();
const noPayeeDiagnosticFiles = [
    'app/api/tb3/paypal/sandbox-payee-diagnostic/route.ts',
    'lib/tb3/paypal-http.ts',
    'lib/tb3/paypal-routes.ts',
    'lib/tb3/paypal-runtime.ts',
    'lib/tb3/paypal-sandbox-payee-diagnostic.ts',
    'scripts/tb3-paypal-typecheck.mjs',
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
    'specs/tb3-commerce-hq/spec.md',
    'tests/tb3-paypal-sandbox-certification.test.mts',
  ];
const orderReadDiagnosticFiles = [
  'app/api/tb3/paypal/sandbox-order-read-diagnostic/route.ts',
  'lib/tb3/paypal-http.ts',
  'lib/tb3/paypal-routes.ts',
  'lib/tb3/paypal-runtime.ts',
  'lib/tb3/paypal-sandbox-order-read-diagnostic.ts',
  'scripts/test-master-guard-contract.mjs',
  'scripts/vercel-ignore-work-branches.mjs',
  'tests/tb3-paypal-sandbox-order-read-diagnostic.test.mts',
  'tests/tb3-paypal.test.mts',
];
const sandboxRecoveryFiles = [
  'app/api/tb3/paypal/sandbox-recovery/route.ts',
  'lib/tb3/paypal-http.ts',
  'lib/tb3/paypal-routes.ts',
  'lib/tb3/paypal-service.ts',
  'scripts/test-master-guard-contract.mjs',
  'scripts/vercel-ignore-work-branches.mjs',
  'tests/tb3-paypal-sandbox-recovery.test.mts',
  'tests/tb3-paypal.test.mts',
];
if (finalParentSha === 'f6573d85dccc6668f2be138f14a5f449d5effaf9') {
  assert.deepEqual(finalChangedFiles, noPayeeDiagnosticFiles, 'verified no-payee diagnostic commit contents changed');
} else if (finalParentSha === '239027511a852f03aef48f24c190c3249f40f2f5') {
  assert.deepEqual(finalChangedFiles, orderReadDiagnosticFiles, 'order-read diagnostic commit may contain only the exact route, handler, transport adapter, and security tests');
} else if (finalParentSha === 'd98c4452278c96e4dd572562372f1ed62ba29eff') {
  assert.deepEqual(finalChangedFiles, sandboxRecoveryFiles, 'Sandbox recovery commit may contain only its fixed recovery route, service method, security tests, and Preview guard');
} else {
  assert.equal(finalParentSha, '84bf3899bc39c2872b6054121cf6e1a80b3e9466', 'order-read diagnostic cleanup must directly follow its verified Preview deployment');
  assert.deepEqual(finalChangedFiles, [
    'app/api/tb3/paypal/sandbox-order-read-diagnostic/route.ts',
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
  ], 'diagnostic cleanup commit may contain only route removal and its scoped Preview deployment guard');
}

const tb3Preview = runIgnoreGuard('work/tb3-commerce-hq-20261109', finalSha, 'preview');
assert.equal(tb3Preview.status, 1, 'the exact final TB3 policy revision must continue to Preview build');
assert.match(tb3Preview.stdout, /Vercel deployment allowed for branch: work\/tb3-commerce-hq-20261109 target: preview/);

const tb3PreviewFallback = runIgnoreGuard('work/tb3-commerce-hq-20261109', finalSha, '', 'preview');
assert.equal(tb3PreviewFallback.status, 1, 'standard VERCEL_ENV preview fallback must allow this branch');

for (const [branch, commit, target, vercelEnv] of [
  ['work/another-branch', finalSha, 'preview', ''],
  ['work/tb3-commerce-hq-20261107', finalSha, 'preview', ''],
  ['work/tb3-commerce-hq-20261109', finalSha, 'production', ''],
  ['work/tb3-commerce-hq-20261109', finalSha, 'production', 'preview'],
  ['work/tb3-commerce-hq-20261109', finalSha, '', 'development'],
  ['work/tb3-commerce-hq-20261109', '5720a3f1c8cf722d50a7d174e4976424db03118a', 'preview', ''],
  ['work/tb3-commerce-hq-20261109', finalSha, 'production', ''],
  ['work/tb3-commerce-hq-20261109', '1111111111111111111111111111111111111111', 'preview', ''],
]) {
  const blocked = runIgnoreGuard(branch, commit, target, vercelEnv);
  assert.equal(blocked.status, 0, `work branch must remain ignored: ${branch} (${target || vercelEnv})`);
  assert.match(blocked.stdout, /Ignoring Vercel deployment for local-only branch/);
}

const otherBranch = runIgnoreGuard('feature/ordinary-preview', '1111111111111111111111111111111111111111', 'preview');
assert.equal(otherBranch.status, 1, 'non-work preview branch behavior must remain unchanged');

console.log('EA compensating master guard contract passed.');

