const SHA = /^[a-f0-9]{40}$/i;

function deploymentBaseUrl(deployment, { projectId, sourceCommit }) {
  if (!deployment || deployment.projectId !== projectId) return null;
  if (deployment.meta?.githubCommitSha !== sourceCommit) return null;
  if (!(deployment.uid || deployment.id)) return null;
  if (!['READY'].includes(deployment.readyState || deployment.state)) return null;
  if (deployment.target && deployment.target !== 'preview') return null;
  if (typeof deployment.url !== 'string' || !deployment.url.trim()) return null;

  let parsed;
  try { parsed = new URL(`https://${deployment.url}`); } catch { return null; }
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.vercel.app') || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
  return parsed.origin;
}

export async function resolveVercelPreview({
  sourceCommit,
  token,
  projectId,
  teamId,
  fetchImpl = fetch,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxAttempts = 40,
  intervalMs = 15000,
}) {
  if (!SHA.test(sourceCommit || '')) throw new Error('A full 40-character source commit is required to resolve the preview');
  if (!token) throw new Error('VERCEL_TOKEN is unavailable; cannot discover the exact preview deployment');
  if (!projectId || !teamId) throw new Error('EA_VERCEL_PROJECT_ID and EA_VERCEL_TEAM_ID are required');
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new Error('maxAttempts must be a positive integer');

  const query = new URLSearchParams({ projectId, teamId, sha: sourceCommit, target: 'preview', state: 'READY', limit: '20' });
  const endpoint = `https://api.vercel.com/v7/deployments?${query}`;
  let lastObserved = 'no matching READY preview deployment has appeared';
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetchImpl(endpoint, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Vercel deployment lookup failed with HTTP ${response.status}`);
    const body = await response.json();
    if (!Array.isArray(body.deployments)) throw new Error('Vercel deployment lookup returned an invalid response');

    const exact = body.deployments
      .filter((deployment) => deployment.meta?.githubCommitSha === sourceCommit)
      .sort((a, b) => Number(b.createdAt || b.created || 0) - Number(a.createdAt || a.created || 0));
    for (const deployment of exact) {
      const url = deploymentBaseUrl(deployment, { projectId, sourceCommit });
      if (url) return { url, deploymentId: deployment.uid || deployment.id, sourceCommit };
    }
    if (exact.length) lastObserved = 'matching commit exists, but its deployment is not READY or its project URL is invalid';
    if (attempt + 1 < maxAttempts) await wait(intervalMs);
  }
  throw new Error(`Could not resolve a READY preview for ${sourceCommit}: ${lastObserved}`);
}
