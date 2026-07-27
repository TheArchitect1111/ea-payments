/**
 * Pilot Amplifi/Magnifi client enablement (Client Launch Gate Step 2).
 *
 * Usage:
 *   node scripts/pilot-amplifi-magnifi-client.mjs --list
 *   node scripts/pilot-amplifi-magnifi-client.mjs --entitle <portal-slug>
 *   node scripts/pilot-amplifi-magnifi-client.mjs --smoke <portal-slug>
 *   node scripts/pilot-amplifi-magnifi-client.mjs --loop-demo
 *
 * Requires AIRTABLE_API_KEY in .env.local for --list / --entitle.
 * --loop-demo uses production demo-enter (no Airtable write).
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const BASE = (process.env.EA_CERT_BASE || 'https://efficiencyarchitects.online').replace(/\/$/, '');
const OUT_DIR = join(root, 'docs/audits/runtime-evidence-amplifi-magnifi-client-use');

function loadEnvFile(path) {
  if (!path || !existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, i)] = v;
  }
  return out;
}

const args = process.argv.slice(2);
const envFileFlag = args.findIndex((a) => a === '--env-file');
const envFilePath =
  envFileFlag >= 0
    ? args[envFileFlag + 1]
    : join(root, '.env.local');
const filteredArgs = args.filter((_, i) => i !== envFileFlag && i !== envFileFlag + 1);

const env = { ...loadEnvFile(envFilePath), ...process.env };
const key = env.AIRTABLE_API_KEY || env.AIRTABLE_PAT;
const baseId = env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
const orgsTable = env.AIRTABLE_ORGANIZATIONS_TABLE || 'Organizations';
const entitlementsTable = env.AIRTABLE_ENTITLEMENTS_TABLE || 'Entitlements';

const mode = filteredArgs[0] || '--help';
const slugArg = filteredArgs[1] || '';

function help() {
  console.log(`Usage:
  node scripts/pilot-amplifi-magnifi-client.mjs --list
  node scripts/pilot-amplifi-magnifi-client.mjs --entitle <portal-slug>
  node scripts/pilot-amplifi-magnifi-client.mjs --smoke <portal-slug>
  node scripts/pilot-amplifi-magnifi-client.mjs --loop-demo
`);
}

async function airtable(path, init) {
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Airtable ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  }
  return body;
}

function escapeFormula(s) {
  return String(s).replace(/'/g, "\\'");
}

async function listOrgs() {
  if (!key) throw new Error('Missing AIRTABLE_API_KEY in .env.local');
  const records = [];
  let offset;
  do {
    const q = new URLSearchParams({ pageSize: '100' });
    if (offset) q.set('offset', offset);
    const page = await airtable(`${encodeURIComponent(orgsTable)}?${q}`);
    records.push(...(page.records || []));
    offset = page.offset;
  } while (offset);
  return records.map((r) => ({
    id: r.id,
    name: String(r.fields?.Name || ''),
    slug: String(r.fields?.Slug || r.fields?.['Portal Slug'] || ''),
    status: String(r.fields?.Status || ''),
  }));
}

async function findOrgBySlug(slug) {
  const needle = slug.trim().toLowerCase();
  const orgs = await listOrgs();
  return (
    orgs.find((o) => o.slug.toLowerCase() === needle) ||
    orgs.find((o) => o.slug.toLowerCase().includes(needle)) ||
    null
  );
}

async function listEntitlements(organizationId) {
  const formula = encodeURIComponent(`{Organization Id}='${escapeFormula(organizationId)}'`);
  const page = await airtable(
    `${encodeURIComponent(entitlementsTable)}?filterByFormula=${formula}&pageSize=100`,
  );
  return (page.records || []).map((r) => ({
    id: r.id,
    moduleId: String(r.fields?.['Module Id'] || ''),
    status: String(r.fields?.Status || ''),
    source: String(r.fields?.Source || ''),
  }));
}

async function upsertModule(organizationId, moduleId, enabled) {
  const existing = await listEntitlements(organizationId);
  const row = existing.find((e) => e.moduleId.toLowerCase() === moduleId.toLowerCase());
  const fields = {
    'Organization Id': organizationId,
    'Module Id': moduleId,
    Status: enabled ? 'active' : 'suspended',
    Source: 'manual',
  };
  if (row) {
    await airtable(`${encodeURIComponent(entitlementsTable)}/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
    return { action: 'updated', moduleId };
  }
  await airtable(encodeURIComponent(entitlementsTable), {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
  return { action: 'created', moduleId };
}

async function entitleSlug(slug) {
  const org = await findOrgBySlug(slug);
  if (!org) throw new Error(`No organization found for slug "${slug}"`);
  const results = [];
  for (const moduleId of ['simplifi', 'amplifi']) {
    results.push(await upsertModule(org.id, moduleId, true));
  }
  const entitlements = await listEntitlements(org.id);
  return { org, results, entitlements };
}

function parseCookies(res) {
  const jar = new Map();
  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  for (const header of raw) {
    const part = header.split(';')[0];
    const i = part.indexOf('=');
    if (i > 0) jar.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return jar;
}

async function smokeSlug(slug) {
  const login = await fetch(`${BASE}/portal/${slug}/amplifi`, { redirect: 'manual' });
  const loc = login.headers.get('location') || '';
  const unauthOk =
    (login.status === 307 || login.status === 308) && /portal\/login/i.test(loc);

  const homeUnauth = await fetch(`${BASE}/portal/${slug}`, { redirect: 'manual' });
  return {
    slug,
    amplifiUnauthStatus: login.status,
    amplifiUnauthLocation: loc,
    amplifiRequiresLogin: unauthOk,
    portalHomeStatus: homeUnauth.status,
    portalHomeLocation: homeUnauth.headers.get('location') || '',
  };
}

async function loopDemo() {
  const enter = await fetch(
    `${BASE}/api/auth/demo-enter?next=${encodeURIComponent('/portal/demo-client/amplifi')}`,
    { redirect: 'manual' },
  );
  const jar = parseCookies(enter);
  const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  if (!jar.has('ea_portal_session')) {
    return { ok: false, error: 'demo-enter did not set session', status: enter.status };
  }

  const analyzeRes = await fetch(`${BASE}/api/portal/captures/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      url: 'https://example.com',
      notes: 'Amplifi/Magnifi client-use pilot loop',
      async: false,
    }),
  });
  const analyzeBody = await analyzeRes.json().catch(() => ({}));
  const recordId = analyzeBody.recordId ?? analyzeBody.record?.id ?? analyzeBody.captureId;
  const magnifiPath = analyzeBody.magnifiUrl || (recordId ? `/magnifi/${recordId}` : null);

  let magnifiOk = false;
  if (magnifiPath) {
    const m = await fetch(`${BASE}${magnifiPath}`, { redirect: 'follow' });
    const html = await m.text();
    magnifiOk =
      m.status === 200 && html.length > 800 && !/Story unavailable|Story retired/i.test(html);
  }

  const amplifi = await fetch(`${BASE}/portal/demo-client/amplifi`, {
    headers: { Cookie: cookie },
    redirect: 'follow',
  });
  const amplifiHtml = await amplifi.text();
  const amplifiOk =
    amplifi.status === 200 &&
    /Amplifi/i.test(amplifiHtml) &&
    /Open latest Magnifi|Review draft|Capture once|Anyone with the link/i.test(amplifiHtml);

  return {
    ok: Boolean(recordId && magnifiOk && amplifiOk),
    recordId,
    magnifiPath,
    magnifiOk,
    amplifiOk,
    amplifiStatus: amplifi.status,
    warningPresent: /Anyone with the link/i.test(amplifiHtml),
  };
}

function writeEvidence(name, payload) {
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, name);
  writeFileSync(path, JSON.stringify(payload, null, 2));
  console.log('Wrote', path);
  return path;
}

async function main() {
  if (mode === '--help' || mode === '-h') {
    help();
    return;
  }

  if (mode === '--list') {
    const orgs = await listOrgs();
    const usable = orgs.filter((o) => o.slug && o.slug !== 'demo-client');
    console.log(`Organizations with slugs (excluding demo-client): ${usable.length}`);
    for (const o of usable.slice(0, 40)) {
      console.log(`- ${o.slug}\t${o.name}\t${o.id}\t${o.status}`);
    }
    writeEvidence('org-list.json', {
      checkedAt: new Date().toISOString(),
      count: usable.length,
      orgs: usable,
    });
    return;
  }

  if (mode === '--entitle') {
    if (!slugArg) throw new Error('Pass a portal slug');
    const result = await entitleSlug(slugArg);
    console.log('Entitled', result.org.slug, result.org.id);
    console.log(result.results);
    const active = result.entitlements.filter(
      (e) =>
        ['simplifi', 'amplifi'].includes(e.moduleId) &&
        ['active', 'trial'].includes(String(e.status).toLowerCase()),
    );
    writeEvidence(`entitle-${result.org.slug}.json`, {
      checkedAt: new Date().toISOString(),
      ...result,
      activeSimplifiAmplifi: active,
    });
    return;
  }

  if (mode === '--smoke') {
    if (!slugArg) throw new Error('Pass a portal slug');
    const smoke = await smokeSlug(slugArg);
    console.log(smoke);
    writeEvidence(`smoke-${slugArg}.json`, {
      checkedAt: new Date().toISOString(),
      base: BASE,
      ...smoke,
    });
    if (!smoke.amplifiRequiresLogin) process.exitCode = 1;
    return;
  }

  if (mode === '--loop-demo') {
    const loop = await loopDemo();
    console.log(loop);
    writeEvidence('loop-demo.json', {
      checkedAt: new Date().toISOString(),
      base: BASE,
      ...loop,
    });
    if (!loop.ok) process.exitCode = 1;
    return;
  }

  help();
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
