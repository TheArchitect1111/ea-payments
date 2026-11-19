import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const sha = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
function run(branch, target, commit = sha) {
  return spawnSync('node', ['scripts/vercel-ignore-work-branches.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, VERCEL_GIT_COMMIT_REF: branch, VERCEL_GIT_COMMIT_SHA: commit, VERCEL_TARGET_ENV: target, VERCEL_ENV: target },
  });
}
assert.equal(run('work/tb3-paypal-oauth-production-diagnostic-20261119', 'preview').status, 1);
assert.equal(run('work/other', 'preview').status, 0);
assert.equal(run('work/tb3-paypal-oauth-production-diagnostic-20261119', 'production').status, 0);
assert.equal(run('work/tb3-paypal-oauth-production-diagnostic-20261119', 'preview', '0'.repeat(40)).status, 0);
assert.match((await import('node:fs')).readFileSync('scripts/vercel-ignore-work-branches.mjs', 'utf8'), /branch === 'master' && target === 'production'/);
console.log('TB3 OAuth Preview exception policy tests passed (5 cases).');
