/**
 * Phase 2D — live wire selected experience + surfaces smoke (production).
 * Uses local ADMIN_SESSION_SECRET (must match Vercel Production) as ea_admin_session cookie.
 *
 * Run from ea-payments-phase2 (or any checkout with scripts/lib/admin-bearer.mjs):
 *   node --env-file=../ea-payments/.env.local scripts/runtime-wire-selected-smoke.mjs
 * or set ADMIN_SESSION_SECRET in the environment.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnvLocal, mintAdminBearerToken } from './lib/admin-bearer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const BASE = (process.env.EA_WIRE_BASE || 'https://efficiencyarchitects.online').replace(/\/$/, '');

function loadEnv() {
  const candidates = [
    join(root, '.env.local'),
    join(root, '..', 'ea-payments', '.env.local'),
  ];
  let env = { ...process.env };
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const i = line.indexOf('=');
      const key = line.slice(0, i).trim();
      let value = line.slice(i + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!env[key]) env[key] = value;
    }
  }
  return loadDotEnvLocal(env);
}

async function req(method, path, { token, body } = {}) {
  const headers = {
    Accept: 'application/json',
    'X-EA-Realm': 'admin',
    Cookie: `ea_admin_session=${token}`,
    Authorization: `Bearer ${token}`,
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json, headers: Object.fromEntries(res.headers.entries()) };
}

async function smokeUrl(url) {
  if (!url) return { url, status: null, skip: true };
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual' });
    return { url, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (err) {
    return { url, status: null, ok: false, error: String(err?.message || err) };
  }
}

async function main() {
  const env = loadEnv();
  const token = mintAdminBearerToken(env);
  if (!token) {
    console.error('FAIL: ADMIN_SESSION_SECRET missing (need match to Vercel Production).');
    process.exit(1);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    steps: [],
  };

  const projectsRes = await req('GET', '/api/projects', { token });
  report.steps.push({ step: 'list-projects', status: projectsRes.status });
  if (projectsRes.status !== 200 || !projectsRes.json?.ok) {
    console.error('FAIL: list projects', projectsRes.status, projectsRes.json);
    writeEvidence(report);
    process.exit(1);
  }

  const projects = projectsRes.json.projects || [];
  const amanda = projects.filter(
    (p) =>
      String(p.client || '').toLowerCase().includes('amanda') ||
      String(p.id || '').toLowerCase().includes('amanda'),
  );
  report.projectCount = projects.length;
  report.amandaCandidates = amanda.map((p) => ({
    id: p.id,
    client: p.client,
    pipelineStatus: p.pipelineStatus,
  }));

  let projectId =
    process.env.EA_WIRE_PROJECT_ID?.trim() ||
    amanda[0]?.id ||
    projects.find((p) => String(p.pipelineStatus || '').includes('REVIEW') || p.pipelineStatus === 'COMPLETE')
      ?.id ||
    projects[0]?.id;

  if (!projectId) {
    console.error('FAIL: no Factory projects found to wire.');
    writeEvidence(report);
    process.exit(1);
  }
  report.projectId = projectId;
  console.log('Using project', projectId);

  // Load / generate concept previews
  let previewGet = await req(
    'GET',
    `/api/admin/factory/concept-previews?projectId=${encodeURIComponent(projectId)}`,
    { token },
  );
  report.steps.push({
    step: 'concept-previews-get',
    status: previewGet.status,
    generated: previewGet.json?.generated,
    previewCount: previewGet.json?.previews?.previews?.length,
  });

  if (previewGet.status === 401 || previewGet.status === 403) {
    console.error('FAIL: admin auth rejected by production (secret mismatch?).', previewGet.json);
    writeEvidence(report);
    process.exit(1);
  }

  if (!previewGet.json?.generated || !previewGet.json?.previews?.previews?.length) {
    console.log('Generating concept previews…');
    const gen = await req('POST', '/api/admin/factory/concept-previews', {
      token,
      body: { projectId },
    });
    report.steps.push({
      step: 'concept-previews-generate',
      status: gen.status,
      error: gen.json?.error,
      previewCount: gen.json?.previews?.previews?.length,
    });
    if (gen.status !== 200 || !gen.json?.ok) {
      console.error('FAIL: generate previews', gen.status, gen.json);
      writeEvidence(report);
      process.exit(1);
    }
    previewGet = gen;
  }

  const bundle = previewGet.json?.previews || previewGet.json;
  const previews = bundle?.previews || [];
  const recommended =
    bundle?.recommendedConceptId ||
    previews.find((p) => p.recommended)?.conceptId ||
    previews[0]?.conceptId;
  const selectedExisting = bundle?.selectedConceptId || null;
  const conceptId = selectedExisting || recommended;
  report.conceptId = conceptId;
  report.selectionStatusBefore = bundle?.selectionStatus;

  if (!conceptId) {
    console.error('FAIL: no conceptId available after preview generate.');
    writeEvidence(report);
    process.exit(1);
  }

  if (!selectedExisting) {
    const sel = await req('POST', '/api/admin/factory/select-concept', {
      token,
      body: {
        projectId,
        selectedConceptId: conceptId,
        selectionStatus: 'awaiting_certify',
      },
    });
    report.steps.push({
      step: 'select-concept',
      status: sel.status,
      selectedConceptId: sel.json?.selectedConceptId,
      selectionStatus: sel.json?.selectionStatus,
      error: sel.json?.error,
    });
    if (sel.status !== 200 || !sel.json?.ok) {
      console.error('FAIL: select concept', sel.status, sel.json);
      writeEvidence(report);
      process.exit(1);
    }
  } else {
    report.steps.push({
      step: 'select-concept',
      status: 'skipped',
      selectedConceptId: selectedExisting,
    });
  }

  console.log('Wiring selected experience…');
  const wire = await req('POST', '/api/admin/factory/publish-selected-concept', {
    token,
    body: { projectId },
  });
  report.steps.push({
    step: 'wire-selected',
    status: wire.status,
    ok: wire.json?.ok,
    websiteStatus: wire.json?.websiteStatus,
    portalSlug: wire.json?.portalSlug,
    error: wire.json?.error,
    surfaces: wire.json?.surfaces || null,
  });

  if (wire.status !== 200 || !wire.json?.ok) {
    console.error('FAIL: wire', wire.status, wire.json);
    writeEvidence(report);
    process.exit(1);
  }

  const surfaces = wire.json.surfaces || {};
  const smokeTargets = [
    surfaces.portalLoginUrl,
    surfaces.portalCtpUrl,
    surfaces.portalHomeUrl,
    surfaces.draftPreviewPath
      ? surfaces.draftPreviewPath.startsWith('http')
        ? surfaces.draftPreviewPath
        : `${BASE}${surfaces.draftPreviewPath}`
      : null,
    surfaces.websitePreviewPath
      ? surfaces.websitePreviewPath.startsWith('http')
        ? surfaces.websitePreviewPath
        : `${BASE}${surfaces.websitePreviewPath}`
      : null,
    `${BASE}/sites/amanda-catherine`,
  ];

  const smokes = [];
  for (const url of smokeTargets) {
    const s = await smokeUrl(url);
    smokes.push(s);
    console.log('smoke', s.status, s.url);
  }
  report.surfaceSmoke = smokes;
  report.chassisModules = surfaces.chassisModules;
  report.memberHomeSaved = surfaces.memberHomeSaved;
  report.publicSiteQuarantined = surfaces.publicSiteQuarantined;
  report.loginCtaPresent = surfaces.loginCtaPresent;

  const loginOk = smokes.find((s) => s.url === surfaces.portalLoginUrl)?.ok;
  const quarantineOk = smokes.find((s) => String(s.url || '').includes('/sites/amanda-catherine'))
    ?.status === 404;

  report.verdict =
    wire.json.ok && loginOk && surfaces.publicSiteQuarantined !== false && quarantineOk
      ? 'PASS_WIRE_DRAFT_ONLY'
      : 'PARTIAL';

  writeEvidence(report);
  console.log(JSON.stringify({ verdict: report.verdict, projectId, conceptId, surfaces }, null, 2));
  process.exit(report.verdict.startsWith('PASS') ? 0 : 2);
}

function writeEvidence(report) {
  const dir = join(root, 'docs/audits/runtime-evidence-name-to-experience-phase2d');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'wire-surfaces-smoke.json'), JSON.stringify(report, null, 2));
  console.log('Wrote', join(dir, 'wire-surfaces-smoke.json'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
