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

function isApprovedTb3PrintfulDiagnosticPreviewRevision() {
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
  const permittedDiagnosticFiles = [
    'app/api/tb3/printful/diagnostic/route.ts',
    'lib/tb3/printful-diagnostic-handler.ts',
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
    'tests/tb3-printful-diagnostic.test.mts',
  ];
  return headSha === deploymentSha &&
    parentSha === 'dc991cda004fba853ea3d25f612bfe18e468dbfb' &&
    JSON.stringify(changedFiles) === JSON.stringify(permittedDiagnosticFiles);
}

function isApprovedTb3PrintfulCredentialPreviewRevision() {
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
  const permittedCredentialFiles = [
    'app/api/tb3/printful/diagnostic/route.ts',
    'lib/tb3/printful-diagnostic-handler.ts',
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
    'specs/tb3-commerce-hq/spec.md',
    'tests/tb3-printful-diagnostic.test.mts',
  ];
  return headSha === deploymentSha &&
    parentSha === '731dca5aaa4b37b6bb11eb352433ded9e1988052' &&
    JSON.stringify(changedFiles) === JSON.stringify(permittedCredentialFiles);
}

function isApprovedTb3LedgerDiagnosticPreviewRevision() {
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
    parentSha === '24ac06dfcced1be09849c4edc39f650b943ae11c' &&
    JSON.stringify(changedFiles) === JSON.stringify(permittedPolicyFiles);
}

function isApprovedTb3LedgerSchemaDetailPreviewRevision() {
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
  const permittedDiagnosticFiles = [
    'lib/tb3/paypal-ledger-diagnostic-handler.ts',
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
    'tests/tb3-paypal-ledger-diagnostic.test.mts',
  ];
  return headSha === deploymentSha &&
    parentSha === 'c2a727dc62501ab21b31c65427dc91bc77303945' &&
    JSON.stringify(changedFiles) === JSON.stringify(permittedDiagnosticFiles);
}

function isApprovedTb3LedgerDiagnosticCorrectionPreviewRevision() {
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
  const permittedDiagnosticFiles = [
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
  ];
  return headSha === deploymentSha &&
    parentSha === 'c41e3b8f9a85ba1aab4b6f93adc918b63ca443c1' &&
    JSON.stringify(changedFiles) === JSON.stringify(permittedDiagnosticFiles);
}

function isApprovedTb3SandboxCheckoutPreviewRevision() {
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
  const permittedSandboxCheckoutFiles = [
    'scripts/test-master-guard-contract.mjs',
    'scripts/vercel-ignore-work-branches.mjs',
  ];
  return headSha === deploymentSha &&
    parentSha === 'd4451f33156cf243575923758758d882a381b82e' &&
    JSON.stringify(changedFiles) === JSON.stringify(permittedSandboxCheckoutFiles);
}

// Work branches remain ignored unless an exact, SHA-bound Preview exception
// below matches its approved parent and complete changed-file set.
if (branch.startsWith('work/') &&
    !isApprovedTb3PreviewRevision() &&
    !isApprovedTb3PrintfulDiagnosticPreviewRevision() &&
    !isApprovedTb3PrintfulCredentialPreviewRevision() &&
    !isApprovedTb3LedgerDiagnosticPreviewRevision() &&
    !isApprovedTb3LedgerSchemaDetailPreviewRevision() &&
    !isApprovedTb3LedgerDiagnosticCorrectionPreviewRevision() &&
    !isApprovedTb3SandboxCheckoutPreviewRevision()) {
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
