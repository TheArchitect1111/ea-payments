import registry from '../config/ea-active-projects.json' with { type: 'json' };

const DEFAULT_TIMEOUT_MS = 12000;

function state(status, detail, evidence = {}) {
  return { status, detail, ...evidence };
}

async function fetchWithTimeout(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkGitHub(repo, token) {
  if (!repo) return state('unlinked', 'No canonical GitHub repository is recorded.');
  try {
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ea-project-status-monitor' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithTimeout(`https://api.github.com/repos/${repo}`, { headers });
    if (response.status === 404 && !token) {
      return state('unverified', 'Repository is private or unavailable; EA_STATUS_GITHUB_TOKEN is required.', { httpStatus: 404 });
    }
    if (!response.ok) return state('error', `GitHub returned HTTP ${response.status}.`, { httpStatus: response.status });
    const body = await response.json();
    return state(body.archived ? 'warning' : 'healthy', body.archived ? 'Repository is archived.' : 'Repository is reachable.', {
      defaultBranch: body.default_branch ?? null,
      archived: Boolean(body.archived),
      visibility: body.visibility ?? null,
      updatedAt: body.updated_at ?? null,
    });
  } catch (error) {
    return state('error', error instanceof Error ? error.message : 'GitHub check failed.');
  }
}

function productionDeployment(project) {
  return project?.targets?.production ?? project?.latestDeployments?.find((item) => item?.target === 'production') ?? project?.latestDeployments?.[0] ?? null;
}

async function checkVercel(projectName, token, teamId) {
  if (!projectName) return state('not_applicable', 'No Vercel deployment is expected.');
  if (!token) return state('unconfigured', 'EA_STATUS_VERCEL_TOKEN is not configured.');
  if (!teamId) return state('unconfigured', 'EA_STATUS_VERCEL_TEAM_ID is not configured.');
  try {
    const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(projectName)}?teamId=${encodeURIComponent(teamId)}`;
    const response = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return state('error', `Vercel returned HTTP ${response.status}.`, { httpStatus: response.status });
    const body = await response.json();
    const deployment = productionDeployment(body);
    const readyState = deployment?.readyState ?? deployment?.state ?? null;
    if (!deployment) return state('warning', 'Project exists but no deployment was returned.', { projectId: body.id ?? null });
    return state(readyState === 'READY' ? 'healthy' : 'error', `Latest deployment state: ${readyState ?? 'unknown'}.`, {
      projectId: body.id ?? null,
      deploymentId: deployment.id ?? null,
      readyState,
      deploymentUrl: deployment.url ?? null,
      deploymentTarget: deployment.target ?? 'production',
    });
  } catch (error) {
    return state('error', error instanceof Error ? error.message : 'Vercel check failed.');
  }
}

async function checkPublicPage(project) {
  if (!project.publicUrl) {
    return project.repositoryOnly
      ? state('not_applicable', 'Repository-only project; no public page is expected.')
      : state('unconfigured', 'No canonical public URL is recorded.');
  }
  try {
    const response = await fetchWithTimeout(project.publicUrl, { redirect: 'follow', headers: { 'User-Agent': 'EA-Project-Status/1.0' } });
    const text = (await response.text()).slice(0, 250000);
    if (!response.ok) return state('error', `Public URL returned HTTP ${response.status}.`, { httpStatus: response.status, finalUrl: response.url });
    if (/_vercel_share=|window\.location\.href=["']\/lander/i.test(text)) {
      return state('protected', 'Page is routed through Vercel share/access protection.', { httpStatus: response.status, finalUrl: response.url });
    }
    const markers = project.expectedText ?? [];
    const matched = markers.find((marker) => text.toLowerCase().includes(String(marker).toLowerCase()));
    if (markers.length && !matched) {
      return state('identity_mismatch', `Page is reachable but none of the expected identity markers were found: ${markers.join(', ')}.`, { httpStatus: response.status, finalUrl: response.url });
    }
    return state('healthy', matched ? `Page is reachable and identity marker “${matched}” is present.` : 'Page is reachable.', {
      httpStatus: response.status,
      finalUrl: response.url,
      matchedIdentity: matched ?? null,
    });
  } catch (error) {
    return state('error', error instanceof Error ? error.message : 'Public page check failed.');
  }
}

function overallStatus(project, checks) {
  const critical = new Set(['error', 'protected', 'identity_mismatch']);
  if ([checks.github.status, checks.vercel.status, checks.publicPage.status].some((value) => critical.has(value))) return 'critical';
  const warning = new Set(['unlinked', 'unverified', 'unconfigured', 'warning']);
  if (project.knownConstraint || [checks.github.status, checks.vercel.status, checks.publicPage.status].some((value) => warning.has(value))) return 'attention';
  return 'healthy';
}

export async function runEaProjectStatusChecks(options = {}) {
  const githubToken = options.githubToken ?? process.env.EA_STATUS_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  const vercelToken = options.vercelToken ?? process.env.EA_STATUS_VERCEL_TOKEN ?? process.env.VERCEL_TOKEN;
  const teamId = options.vercelTeamId ?? process.env.EA_STATUS_VERCEL_TEAM_ID ?? registry.vercelTeamId;
  const cache = new Map();
  const cached = (key, operation) => {
    if (!cache.has(key)) cache.set(key, operation());
    return cache.get(key);
  };

  const projects = await Promise.all(registry.projects.map(async (project) => {
    const [github, vercel, publicPage] = await Promise.all([
      cached(`github:${project.githubRepo}`, () => checkGitHub(project.githubRepo, githubToken)),
      cached(`vercel:${project.vercelProject}`, () => checkVercel(project.vercelProject, vercelToken, teamId)),
      checkPublicPage(project),
    ]);
    const checks = { github, vercel, publicPage };
    return { ...project, overall: overallStatus(project, checks), checks };
  }));

  const totals = projects.reduce((acc, project) => {
    acc[project.overall] += 1;
    return acc;
  }, { healthy: 0, attention: 0, critical: 0 });

  return {
    generatedAt: new Date().toISOString(),
    ok: totals.critical === 0,
    totals,
    configuration: {
      githubAuthenticated: Boolean(githubToken),
      vercelAuthenticated: Boolean(vercelToken),
      vercelTeamIdConfigured: Boolean(teamId),
    },
    projects,
  };
}

export function projectStatusMarkdown(report) {
  const lines = [
    '# EA Active Project Status',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Healthy: ${report.totals.healthy} | Attention: ${report.totals.attention} | Critical: ${report.totals.critical}`,
    '',
    '| Project | Overall | GitHub | Vercel | Public page |',
    '|---|---|---|---|---|',
  ];
  for (const project of report.projects) {
    lines.push(`| ${project.name} | ${project.overall} | ${project.checks.github.status} | ${project.checks.vercel.status} | ${project.checks.publicPage.status} |`);
  }
  const critical = report.projects.filter((project) => project.overall === 'critical');
  if (critical.length) {
    lines.push('', '## Critical findings', '');
    for (const project of critical) {
      const details = Object.values(project.checks).filter((check) => ['error', 'protected', 'identity_mismatch'].includes(check.status)).map((check) => check.detail);
      lines.push(`- **${project.name}:** ${details.join(' ')}`);
    }
  }
  return `${lines.join('\n')}\n`;
}
