import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const read = file => readFileSync(path.join(root, file), 'utf8');
const workflow = read('.github/workflows/ea-master-guard.yml');
const productionWorkflow = read('.github/workflows/ea-production-gate.yml');
const promotionVerifier = read('scripts/verify-master-promotion.mjs');
const vercelIgnore = read('scripts/vercel-ignore-work-branches.mjs');
const productionVerifier = read('scripts/verify-production-gate.mjs');

for (const needle of [
  'branches: [master]',
  'pull-requests: read',
  'Unauthorized direct push detected.',
  'Revert unauthorized direct push',
  'git push origin HEAD:master',
  'commits/$SHA/pulls',
  'EA-GATED',
]) assert(workflow.includes(needle), `master guard workflow missing: ${needle}`);

assert(productionWorkflow.includes('node scripts/ea-preview-gate.mjs'), 'Production gate must certify the current-source Preview');
assert(productionWorkflow.includes("preview.status !== 'PASS' || preview.sourceCommit !== sha"), 'Production gate must reject failed or stale Preview evidence');
for (const gate of ['sourceIdentity', 'build', 'assets', 'functional', 'desktopVisual', 'mobileVisual', 'creativeCritic']) {
  assert(productionWorkflow.includes(gate), `Production gate is missing required proof: ${gate}`);
}
assert(productionWorkflow.includes("test \"$CHANGED\" = '.ea/gates/latest.json'"), 'Production promotion must contain only the manifest');
for (const verifier of [promotionVerifier, productionVerifier]) {
  assert(verifier.includes('manifest.sourceCommit !== parentSha'), 'promotion must bind evidence to the exact source parent');
  assert(verifier.includes("changedFiles[0] !== '.ea/gates/latest.json'") || verifier.includes('changedFiles.filter((file) => !allowed.has(file))'), 'promotion must reject unrelated changed files');
  assert(verifier.includes("manifest.status !== 'PASS'"), 'promotion must fail closed on non-PASS evidence');
}
assert(productionVerifier.includes('currentSha !== execFileSync'), 'Vercel source SHA must match the checked-out promotion commit');
assert(vercelIgnore.includes("branch === 'master' && target === 'production'"), 'Production branch must run the gate');
assert(vercelIgnore.includes("branch.startsWith('work/')"), 'work branches must remain blocked without an exact approval exception');

function run(command, args, cwd, env = {}) {
  return spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env }, shell: false });
}
function git(cwd, args) {
  const result = run('git', args, cwd);
  assert.equal(result.status, 0, `git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  return result.stdout.trim();
}
function makeGateFixture(extraPromotionFile = false) {
  const cwd = mkdtempSync(path.join(os.tmpdir(), 'tb3-release-gate-'));
  mkdirSync(path.join(cwd, 'scripts'), { recursive: true });
  copyFileSync(path.join(root, 'scripts/verify-production-gate.mjs'), path.join(cwd, 'scripts/verify-production-gate.mjs'));
  copyFileSync(path.join(root, 'scripts/verify-master-promotion.mjs'), path.join(cwd, 'scripts/verify-master-promotion.mjs'));
  copyFileSync(path.join(root, 'scripts/vercel-ignore-work-branches.mjs'), path.join(cwd, 'scripts/vercel-ignore-work-branches.mjs'));
  git(cwd, ['-c', 'init.defaultBranch=main', 'init']);
  git(cwd, ['config', 'user.name', 'TB3 local gate test']);
  git(cwd, ['config', 'user.email', 'tb3-gate-test@example.invalid']);
  writeFileSync(path.join(cwd, 'source.txt'), 'source fixture\n');
  git(cwd, ['add', 'source.txt']);
  git(cwd, ['commit', '-m', 'source fixture']);
  const sourceSha = git(cwd, ['rev-parse', 'HEAD']);
  const gates = Object.fromEntries(['sourceIdentity', 'build', 'assets', 'functional', 'desktopVisual', 'mobileVisual', 'creativeCritic'].map(name => [name, { status: 'PASS', proof: `fixture:${name}` }]));
  const manifest = { sourceCommit: sourceSha, previewUrl: 'https://preview.example.invalid', status: 'PASS', completedAt: '2026-11-20T00:00:00.000Z', gates };
  mkdirSync(path.join(cwd, '.ea', 'gates'), { recursive: true });
  writeFileSync(path.join(cwd, '.ea', 'gates/latest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (extraPromotionFile) writeFileSync(path.join(cwd, 'unrelated.txt'), 'must block promotion\n');
  git(cwd, ['add', '.ea/gates/latest.json', ...(extraPromotionFile ? ['unrelated.txt'] : [])]);
  git(cwd, ['commit', '-m', 'manifest-only promotion fixture']);
  return { cwd, sourceSha, promotionSha: git(cwd, ['rev-parse', 'HEAD']), manifest };
}

const fixture = makeGateFixture();
const env = { VERCEL_GIT_COMMIT_SHA: fixture.promotionSha };
try {
  for (const script of ['scripts/verify-production-gate.mjs', 'scripts/verify-master-promotion.mjs']) {
    const pass = run(process.execPath, [path.join(fixture.cwd, script)], fixture.cwd, env);
    assert.equal(pass.status, 0, `${script} should accept an exact-source manifest-only promotion: ${pass.stderr || pass.stdout}`);
    const sourceShaDrift = run(process.execPath, [path.join(fixture.cwd, script)], fixture.cwd, { ...env, VERCEL_GIT_COMMIT_SHA: '0'.repeat(40) });
    if (script.endsWith('verify-production-gate.mjs')) {
      assert.notEqual(sourceShaDrift.status, 0, 'Production gate must reject a Vercel/source SHA mismatch');
      assert.match(sourceShaDrift.stderr, /does not match checked-out HEAD/);
    }
    const badManifest = { ...fixture.manifest, sourceCommit: 'f'.repeat(40) };
    writeFileSync(path.join(fixture.cwd, '.ea/gates/latest.json'), `${JSON.stringify(badManifest, null, 2)}\n`);
    const stale = run(process.execPath, [path.join(fixture.cwd, script)], fixture.cwd, env);
    assert.notEqual(stale.status, 0, `${script} must reject a stale source manifest`);
    assert.match(stale.stderr, /does not match (?:production )?parent/);
    writeFileSync(path.join(fixture.cwd, '.ea/gates/latest.json'), `${JSON.stringify(fixture.manifest, null, 2)}\n`);
  }

  const releasePreview = run(process.execPath, ['scripts/vercel-ignore-work-branches.mjs'], fixture.cwd, {
    VERCEL_GIT_COMMIT_REF: 'release/tb3-path-b-candidate', VERCEL_GIT_COMMIT_SHA: fixture.promotionSha, VERCEL_TARGET_ENV: 'preview', VERCEL_ENV: 'preview',
  });
  assert.equal(releasePreview.status, 1, 'release Preview remains available for certification');
  const unauthorizedWorkPreview = run(process.execPath, ['scripts/vercel-ignore-work-branches.mjs'], fixture.cwd, {
    VERCEL_GIT_COMMIT_REF: 'work/unapproved-tb3-candidate', VERCEL_GIT_COMMIT_SHA: fixture.promotionSha, VERCEL_TARGET_ENV: 'preview', VERCEL_ENV: 'preview',
  });
  assert.equal(unauthorizedWorkPreview.status, 0, 'unapproved work Preview stays blocked');
  const productionPass = run(process.execPath, ['scripts/vercel-ignore-work-branches.mjs'], fixture.cwd, {
    VERCEL_GIT_COMMIT_REF: 'master', VERCEL_GIT_COMMIT_SHA: fixture.promotionSha, VERCEL_TARGET_ENV: 'production', VERCEL_ENV: 'production',
  });
  assert.equal(productionPass.status, 1, 'master Production is allowed only with passing exact-source evidence');

  const bad = makeGateFixture(true);
  try {
    const result = run(process.execPath, [path.join(bad.cwd, 'scripts/verify-production-gate.mjs')], bad.cwd, { VERCEL_GIT_COMMIT_SHA: bad.promotionSha });
    assert.notEqual(result.status, 0, 'Production gate must reject promotion commits containing unrelated files');
    assert.match(result.stderr, /changed non-gate files|promotion commit must change only/);
  } finally { rmSync(bad.cwd, { recursive: true, force: true }); }

  writeFileSync(path.join(fixture.cwd, '.ea/gates/latest.json'), `${JSON.stringify({ ...fixture.manifest, sourceCommit: 'f'.repeat(40) }, null, 2)}\n`);
  const productionBlocked = run(process.execPath, ['scripts/vercel-ignore-work-branches.mjs'], fixture.cwd, {
    VERCEL_GIT_COMMIT_REF: 'master', VERCEL_GIT_COMMIT_SHA: fixture.promotionSha, VERCEL_TARGET_ENV: 'production', VERCEL_ENV: 'production',
  });
  assert.equal(productionBlocked.status, 0, 'master Production must be skipped when source proof is stale');
  assert.match(productionBlocked.stdout, /blocked by mandatory gate/);
} finally { rmSync(fixture.cwd, { recursive: true, force: true }); }

console.log('PASS: master protection, exact-source Preview proof, manifest-only promotion, and fail-closed work/Production routing contracts');
