import { spawnSync } from 'node:child_process';

const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
const deploymentSha = process.env.VERCEL_GIT_COMMIT_SHA || '';
const target = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV || '';

function gitText(args) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function isApprovedTb3PreviewRevision() {
  if (
    branch !== 'work/tb3-commerce-hq-20261109' ||
    target !== 'preview' ||
    !/^[a-f0-9]{40}$/i.test(deploymentSha)
  ) return false;

  const headSha = gitText(['rev-parse', 'HEAD']);
  const parentSha = gitText(['rev-parse', `${deploymentSha}^`]);
  const changedFilesText = gitText(['diff-tree', '--no-commit-id', '--name-only', '-r', deploymentSha]);
  if (!headSha || !parentSha || changedFilesText === null) return false;

  const changedFiles = changedFilesText.split(/\r?\n/).filter(Boolean).sort();
  const permittedPolicyFiles = [
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
  ];
  return headSha === deploymentSha &&
    parentSha === '5720a3f1c8cf722d50a7d174e4976424db03118a' &&
    JSON.stringify(changedFiles) === JSON.stringify(permittedPolicyFiles);
}

// Permit only the final policy-only child of the certified TB3 app revision.
// This validates the Vercel deployment SHA at build time without embedding a
// self-referential SHA. All other work/* refs and all Production targets block.
if (branch.startsWith('work/') && !isApprovedTb3PreviewRevision()) {
  console.log(`[EA Build Space] Ignoring Vercel deployment for local-only branch: ${branch}`);
  process.exit(0);
}

// Preview deployments remain available for QA. Production on master is different:
// it must be a pure promotion commit containing only the signed gate manifest.
if (branch === 'master' && target === 'production') {
  const result = spawnSync('node', ['scripts/verify-production-gate.mjs'], {
    cwd: process.cwd(),
    shell: false,
    stdio: 'inherit',
    env: process.env,
  });
  if ((result.status ?? 2) !== 0) {
    console.log('[EA Build Space] Production deployment blocked by mandatory gate.');
    process.exit(0); // Vercel ignoreCommand: 0 means skip deployment.
  }
}

console.log(`[EA Build Space] Vercel deployment allowed for branch: ${branch || '(unknown)'} target: ${target || '(unknown)'}`);
process.exit(1); // Vercel ignoreCommand: 1 means continue deployment.
