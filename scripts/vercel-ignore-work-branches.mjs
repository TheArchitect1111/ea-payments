const branch = process.env.VERCEL_GIT_COMMIT_REF || '';

const deployAllowed =
  branch === 'master' ||
  branch === 'main' ||
  branch.startsWith('preview/');

if (!deployAllowed) {
  console.log(`[EA Build Space] Ignoring Vercel deployment for workspace-only branch: ${branch || '(unknown)'}`);
  process.exit(0);
}

console.log(`[EA Build Space] Vercel deployment allowed for promoted branch: ${branch}`);
process.exit(1);
