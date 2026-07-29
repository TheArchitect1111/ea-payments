/**
 * Production-authenticated Quick Launch / preview regression (opt-in).
 *
 * Requires:
 *   PRODUCTION_BASE_URL=https://efficiencyarchitects.online
 *   ADMIN_SESSION_COOKIE=<ea_admin_session cookie value>
 *
 * Optional:
 *   REPAIR_PROJECT_ID=proj-ms5xnut4-517551
 *
 * Run:
 *   npx --yes tsx scripts/test-production-quick-launch-previews.ts
 */
import assert from 'node:assert/strict';

const base = (process.env.PRODUCTION_BASE_URL || '').replace(/\/$/, '');
const cookie = process.env.ADMIN_SESSION_COOKIE || '';
const repairProjectId = process.env.REPAIR_PROJECT_ID || 'proj-ms5xnut4-517551';

if (!base || !cookie) {
  console.log(
    'SKIP test-production-quick-launch-previews.ts — set PRODUCTION_BASE_URL and ADMIN_SESSION_COOKIE',
  );
  process.exit(0);
}

async function api(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; json: Record<string, unknown>; text: string }> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Cookie: `ea_admin_session=${cookie}`,
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = {};
  }
  return { status: res.status, json, text };
}

async function assertPreviewOk(path: string, label: string) {
  const res = await fetch(`${base}${path}`, {
    headers: { Cookie: `ea_admin_session=${cookie}` },
    redirect: 'follow',
  });
  const body = await res.text();
  assert.equal(res.status, 200, `${label} status ${res.status} for ${path}`);
  assert.doesNotMatch(body, /File not found|Preview not ready|Website preview unavailable/i, label);
  assert.match(body, /Factory preview|draft \(not published\)|portal/i, `${label} body`);
}

// 1) Repair / verify Ascension Circle project previews when concepts exist
{
  const status = await api(`/api/projects/${encodeURIComponent(repairProjectId)}`);
  assert.equal(status.status, 200, 'repair project status');
  assert.equal(status.json.ok, true);

  const launch = status.json.launch as
    | {
        conceptUrls?: Array<{
          conceptId: string;
          websitePreviewPath: string;
          portalPreviewPath: string;
        }>;
        conceptPackReady?: boolean;
        hasExperienceConcepts?: boolean;
      }
    | undefined;

  if (launch?.hasExperienceConcepts && !launch.conceptPackReady) {
    const gen = await api(`/api/projects/${encodeURIComponent(repairProjectId)}/concept-previews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true }),
    });
    assert.ok(gen.status < 500, `repair generate status ${gen.status}`);
  }

  const refreshed = await api(`/api/projects/${encodeURIComponent(repairProjectId)}`);
  const urls =
    (
      refreshed.json.launch as
        | {
            conceptUrls?: Array<{
              name: string;
              websitePreviewPath: string;
              portalPreviewPath: string;
            }>;
          }
        | undefined
    )?.conceptUrls || [];

  console.log(`Ascension recovery conceptUrls=${urls.length}`);
  for (const row of urls) {
    await assertPreviewOk(row.websitePreviewPath, `ascension website ${row.name}`);
    await assertPreviewOk(row.portalPreviewPath, `ascension portal ${row.name}`);
  }
}

// 2) New production-safe Quick Launch subject
const subject = `UXG Prod ${Date.now().toString(36)}`;
const create = await api('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client: subject,
    goal: 'Research the subject and produce a matched website and portal experience',
    deliverable: 'Website + Portal',
    notes: [
      'Distinguishing detail: fictional launch-regression subject for EA Factory QA',
      'Desired output: Website + Portal',
      'Source: Universal Quick Launch',
    ].join('\n'),
    source: 'admin',
  }),
});
assert.equal(create.status, 200, `create status ${create.status} ${create.text.slice(0, 200)}`);
const projectId = String(
  (create.json.project as { id?: string } | undefined)?.id || create.json.projectId || '',
);
assert.ok(projectId.startsWith('proj-'), `projectId ${projectId}`);
console.log(`Created production test project ${projectId} (${subject})`);

const deadline = Date.now() + 12 * 60_000;
let ready = false;
let lastLabel = '';
while (Date.now() < deadline) {
  const poll = await api(`/api/projects/${encodeURIComponent(projectId)}`);
  assert.equal(poll.status, 200);
  const launch = poll.json.launch as
    | {
        conceptPackReady?: boolean;
        conceptUrls?: unknown[];
        plainLanguageStage?: string;
        statusLabel?: string;
        identityBlocked?: boolean;
      }
    | undefined;
  lastLabel = String(
    poll.json.plainLanguageStage || launch?.plainLanguageStage || launch?.statusLabel || '',
  );
  console.log('poll', {
    status: (poll.json.project as { pipelineStatus?: string })?.pipelineStatus,
    stage: lastLabel,
    ready: Boolean(poll.json.ready || launch?.conceptPackReady),
  });
  if (launch?.identityBlocked) {
    throw new Error(`Identity blocked for ${projectId}: ${JSON.stringify(launch)}`);
  }
  if (poll.json.ready || launch?.conceptPackReady) {
    ready = true;
    break;
  }
  if (poll.json.failed) {
    throw new Error(`Pipeline failed for ${projectId}`);
  }
  await new Promise((r) => setTimeout(r, 8000));
}

assert.equal(ready, true, `timed out waiting for concepts (${lastLabel})`);

const final = await api(`/api/projects/${encodeURIComponent(projectId)}`);
const conceptUrls =
  (
    final.json.launch as
      | {
          conceptUrls?: Array<{
            name: string;
            websitePreviewPath: string;
            portalPreviewPath: string;
          }>;
        }
      | undefined
  )?.conceptUrls || [];
assert.equal(conceptUrls.length, 3, 'expected three concepts');

for (const row of conceptUrls) {
  await assertPreviewOk(row.websitePreviewPath, `new website ${row.name}`);
  await assertPreviewOk(row.portalPreviewPath, `new portal ${row.name}`);
}

// Fresh request durability (no warm memory assumption)
for (const row of conceptUrls) {
  await assertPreviewOk(row.websitePreviewPath, `refresh website ${row.name}`);
}

console.log('test-production-quick-launch-previews.ts: ok');
console.log(
  JSON.stringify(
    {
      projectId,
      subject,
      previews: conceptUrls.flatMap((c) => [c.websitePreviewPath, c.portalPreviewPath]),
    },
    null,
    2,
  ),
);
