/**
 * Launch prep + field-demo verification against a live base URL.
 *
 * Env:
 *   EACP_CHATGPT_ACTION_KEY (required)
 *   VERIFY_BASE_URL (default https://efficiencyarchitects.online)
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

const base = (process.env.VERIFY_BASE_URL || 'https://efficiencyarchitects.online').replace(
  /\/$/,
  '',
);
const key = process.env.EACP_CHATGPT_ACTION_KEY?.trim();

async function getJson(path, init) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    signal: AbortSignal.timeout(180_000),
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

console.log(`[verify] base=${base}`);

const connectHealth = await getJson('/api/health/connect-nurture');
console.log(
  '[connect-health]',
  JSON.stringify({
    status: connectHealth.status,
    ok: connectHealth.body.ok,
    cron: connectHealth.body.cron?.secretConfigured,
    matrix: connectHealth.body.matrix?.score,
    due: connectHealth.body.nurture?.dueSteps,
  }),
);

const launchHealth = await getJson('/api/health/launch');
console.log(
  '[launch-health]',
  JSON.stringify({
    status: launchHealth.status,
    platform: launchHealth.body.status,
    websitePortalAuto: launchHealth.body.checks?.products?.websitePortalAuto,
  }),
);

if (!key) {
  console.error('[verify] EACP_CHATGPT_ACTION_KEY missing — skip connect-finish + field-demo POST');
  process.exit(2);
}

console.log('[connect-finish] running…');
const finish = await getJson('/api/eacp/connect-finish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orgSlug: 'demo-client', count: 20 }),
});
console.log(
  '[connect-finish]',
  JSON.stringify({
    status: finish.status,
    ok: finish.body.ok,
    ready: finish.body.ready,
    matrixScore: finish.body.matrixScore ?? finish.body.matrix?.score,
    launchScore: finish.body.launchScore,
    summary: finish.body.summary,
    error: finish.body.error,
    storageOk: finish.body.storageSetup?.ok,
  }),
);

const connectHealthAfter = await getJson('/api/health/connect-nurture');
console.log(
  '[connect-health-after]',
  JSON.stringify({
    status: connectHealthAfter.status,
    ok: connectHealthAfter.body.ok,
    matrix: connectHealthAfter.body.matrix?.score,
    due: connectHealthAfter.body.nurture?.dueSteps,
  }),
);

console.log('[field-demo] running…');
const demo = await getJson('/api/eacp/field-demo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client: 'Acme Roofing Field Demo',
    industry: 'home services',
    goal: 'book more estimate appointments',
    deliverable: 'Website + Portal',
    notes: 'Facebook and word of mouth; no real website. Field demo verification.',
  }),
});
console.log(
  '[field-demo]',
  JSON.stringify({
    status: demo.status,
    ok: demo.body.ok,
    message: demo.body.message,
    siteUrl: demo.body.siteUrl,
    reportUrl: demo.body.reportUrl,
    portalUrl: demo.body.portalUrl,
    errors: demo.body.errors,
  }),
);

if (demo.body.siteUrl) {
  const site = await fetch(demo.body.siteUrl, { signal: AbortSignal.timeout(30_000) });
  console.log('[site-http]', site.status, demo.body.siteUrl);
}
if (demo.body.reportUrl) {
  const report = await fetch(demo.body.reportUrl, { signal: AbortSignal.timeout(30_000) });
  console.log('[report-http]', report.status, demo.body.reportUrl);
}

const matrixOk =
  Number(finish.body.matrixScore ?? finish.body.matrix?.score ?? 0) >= 67 ||
  Number(connectHealthAfter.body.matrix?.score ?? 0) >= 67;
const ok =
  launchHealth.body.checks?.products?.websitePortalAuto === true &&
  finish.status < 500 &&
  finish.body.ok !== false &&
  Number(connectHealthAfter.body.nurture?.dueSteps ?? 99) === 0 &&
  matrixOk &&
  demo.status < 500 &&
  demo.body.ok !== false &&
  !demo.body.errors?.some((e) => String(e).startsWith('Website:'));
process.exit(ok ? 0 : 1);
