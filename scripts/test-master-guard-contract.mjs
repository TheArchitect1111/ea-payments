import { readFileSync } from 'node:fs';
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
  '[EA-GATED]',
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

console.log('EA compensating master guard contract passed.');
