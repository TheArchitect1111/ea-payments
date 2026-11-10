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
assert.equal(parentShaResult.stdout.trim(), '24ac06dfcced1be09849c4edc39f650b943ae11c', 'ledger diagnostic guard revision must be the direct child of the committed diagnostic');
const changedFilesResult = spawnSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', finalSha], { encoding: 'utf8' });
assert.equal(changedFilesResult.status, 0, 'final candidate change list must be available');
assert.deepEqual(
  changedFilesResult.stdout.trim().split(/\r?\n/).filter(Boolean).sort(),
  [
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
  ],
  'final candidate may contain only the exact TB3 Preview guard policy and its contract test',
);

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
  ['work/tb3-commerce-hq-20261109', '1111111111111111111111111111111111111111', 'preview', ''],
]) {
  const blocked = runIgnoreGuard(branch, commit, target, vercelEnv);
  assert.equal(blocked.status, 0, `work branch must remain ignored: ${branch} (${target || vercelEnv})`);
  assert.match(blocked.stdout, /Ignoring Vercel deployment for local-only branch/);
}

const otherBranch = runIgnoreGuard('feature/ordinary-preview', '1111111111111111111111111111111111111111', 'preview');
assert.equal(otherBranch.status, 1, 'non-work preview branch behavior must remain unchanged');

console.log('EA compensating master guard contract passed.');
