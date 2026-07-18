/**
 * Smoke EA Factory Phase 1 launcher against a live base URL.
 *
 * Env: EACP_CHATGPT_ACTION_KEY, VERIFY_BASE_URL (optional)
 */
import fs from 'node:fs';

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const key = line.slice(0, i);
    let value = line.slice(i + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.env.local');

const base = (process.env.VERIFY_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const key = process.env.EACP_CHATGPT_ACTION_KEY?.trim();

async function getJson(path, init) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    signal: AbortSignal.timeout(120_000),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 400) };
  }
  return { status: res.status, body };
}

console.log(`[factory-verify] base=${base}`);

const health = await getJson('/api/health/factory-queue');
console.log('[health]', JSON.stringify({ status: health.status, ok: health.body.ok, queued: health.body.queued }));

if (!key) {
  console.error('EACP_CHATGPT_ACTION_KEY missing');
  process.exit(2);
}

const launch = await getJson('/api/launch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: 'Launch Acme Factory Verify Co',
    goal: 'validate Phase 1 launcher pipeline',
    deliverable: 'Website + Portal',
    industry: 'services',
  }),
});

console.log(
  '[launch]',
  JSON.stringify({
    status: launch.status,
    ok: launch.body.ok,
    projectId: launch.body.projectId,
    pipeline: launch.body.status,
  }),
);

if (!launch.body.projectId) {
  process.exit(1);
}

let detail;
for (let i = 0; i < 12; i += 1) {
  await new Promise((r) => setTimeout(r, 2500));
  detail = await getJson(`/api/projects/${encodeURIComponent(launch.body.projectId)}`);
  const st = detail.body.project?.pipelineStatus;
  console.log(`[poll ${i + 1}]`, st, detail.body.project?.launchId || '');
  if (
    st === 'BUILDING' ||
    st === 'UNDER_REVIEW' ||
    st === 'FAILED' ||
    st === 'CANCELLED'
  ) {
    break;
  }
}

const finalStatus = detail?.body?.project?.pipelineStatus;
const project = detail?.body?.project;
const artifacts = project?.context?.artifacts || [];
const artifactCount = artifacts.length;
const discoveryCount = artifacts.filter((a) => a.provenance?.capabilityId === 'discovery').length;
const planningCount = artifacts.filter(
  (a) => a.provenance?.capabilityId === 'planning' && a.kind !== 'work_order',
).length;
const websiteSites = artifacts.filter((a) => a.kind === 'website_site').length;
const deliverables = artifacts.filter((a) => a.kind === 'deliverable').length;
const ok =
  launch.status < 500 &&
  launch.body.ok &&
  (finalStatus === 'BUILDING' ||
    finalStatus === 'PLANNING' ||
    finalStatus === 'DISCOVERING' ||
    finalStatus === 'RESEARCHING' ||
    finalStatus === 'INTAKE_COMPLETE' ||
    finalStatus === 'QUEUED' ||
    finalStatus === 'INTAKE' ||
    finalStatus === 'UNDER_REVIEW') &&
  (finalStatus !== 'BUILDING' ||
    (Boolean(project?.intake?.primarySourceType) &&
      discoveryCount >= 10 &&
      planningCount >= 11 &&
      websiteSites >= 1 &&
      deliverables >= 1));
console.log(
  '[artifacts]',
  artifactCount,
  'discovery=',
  discoveryCount,
  'planning=',
  planningCount,
  'website_site=',
  websiteSites,
  'deliverables=',
  deliverables,
);
process.exit(ok ? 0 : 1);
