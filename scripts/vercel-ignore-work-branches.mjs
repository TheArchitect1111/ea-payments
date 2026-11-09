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
    'package-lock.json',
    'package.json',
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
  ];
  return headSha === deploymentSha &&
    parentSha === 'fe484be6f6fc0d362e36326189106dd1ead63dfe' &&
    JSON.stringify(changedFiles) === JSON.stringify(permittedPolicyFiles);
}

// Permit only the final candidate child of the committed policy revision.
// It must retain the certified TB3 app and include only policy tests plus the
// runtime package fix needed by the PayPal ledger. All other work/* refs and
// all Production targets block.
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
