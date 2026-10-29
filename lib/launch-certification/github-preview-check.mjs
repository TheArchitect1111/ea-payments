const SHA = /^[a-f0-9]{40}$/i;
const TRUSTED_PREVIEW_SUFFIX = '-the-architects-projects-cc813778.vercel.app';

function hostFromSummary(summary) {
  if (typeof summary !== 'string') return null;
  const links = summary.match(/https:\/\/vercel\.live\/open-feedback\/[^\s)\]"<>]+/g) || [];
  for (const link of links) {
    try {
      const parsed = new URL(link.replace(/&amp;/g, '&'));
      const host = parsed.pathname.split('/').filter(Boolean)[1];
      if (!host) continue;
      const candidate = new URL(`https://${host}`);
      if (candidate.hostname === host && host.startsWith('ea-payments-') && host.endsWith(TRUSTED_PREVIEW_SUFFIX)) return candidate.hostname;
    } catch {}
  }
  return null;
}

export function previewUrlFromCheckRuns(checkRuns, sourceCommit) {
  if (!SHA.test(sourceCommit || '') || !Array.isArray(checkRuns)) return null;
  const check = checkRuns.find((item) => item.name === 'Vercel Preview Comments'
    && item.head_sha === sourceCommit
    && item.status === 'completed'
    && item.conclusion === 'success');
  const host = hostFromSummary(check?.output?.summary);
  return host ? `https://${host}` : null;
}

export async function resolveGithubPreview({
  sourceCommit,
  repository,
  token,
  fetchImpl = fetch,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxAttempts = 40,
  intervalMs = 15000,
}) {
  if (!SHA.test(sourceCommit || '')) throw new Error('A full 40-character source commit is required to resolve the preview');
  if (!/^[^/]+\/[^/]+$/.test(repository || '')) throw new Error('GITHUB_REPOSITORY is required to resolve the preview');
  if (!token) throw new Error('GITHUB_TOKEN is unavailable; cannot resolve the commit-bound preview check');
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new Error('maxAttempts must be a positive integer');

  const endpoint = `https://api.github.com/repos/${repository}/commits/${sourceCommit}/check-runs?per_page=100`;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetchImpl(endpoint, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`GitHub check-run lookup failed with HTTP ${response.status}`);
    const body = await response.json();
    if (!Array.isArray(body.check_runs)) throw new Error('GitHub check-run lookup returned an invalid response');
    const url = previewUrlFromCheckRuns(body.check_runs, sourceCommit);
    if (url) return { url, sourceCommit };
    if (attempt + 1 < maxAttempts) await wait(intervalMs);
  }
  throw new Error(`Could not resolve a successful, commit-bound Vercel preview check for ${sourceCommit}`);
}
