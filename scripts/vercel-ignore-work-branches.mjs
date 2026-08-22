const branch = process.env.VERCEL_GIT_COMMIT_REF || '';

if (branch.startsWith('work/')) {
  console.log(`[EA Build Space] Ignoring Vercel deployment for local-only branch: ${branch}`);
  process.exit(0);
}

console.log(`[EA Build Space] Vercel deployment allowed for branch: ${branch || '(unknown)'}`);
process.exit(1);
