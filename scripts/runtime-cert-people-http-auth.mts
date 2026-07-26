#!/usr/bin/env node
/**
 * Authenticated HTTP probes for Phase 2A People (synthetic session cookie).
 * Requires local next with UNIVERSAL_PEOPLE=1.
 * Run: npx tsx scripts/runtime-cert-people-http-auth.mts
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Load .env.local so HMAC signing matches next dev secrets. */
function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}
loadEnvLocal();

const { EA_PORTAL_COOKIE, signSession } = await import('../lib/ea-portal-auth.ts');

const base = (process.env.CERT_BASE_URL || 'http://127.0.0.1:3010').replace(/\/$/, '');
const evidenceDir = join(process.cwd(), 'docs', 'audits', 'runtime-evidence-people-phase2a');
mkdirSync(evidenceDir, { recursive: true });

type Row = {
  id: string;
  route: string;
  method: string;
  role: string;
  slug: string;
  expected: string;
  status: number | string;
  bodySnippet: string;
  pass: boolean;
};

const rows: Row[] = [];

async function cookieFor(input: {
  slug: string;
  role: string;
  email: string;
  orgId?: string;
}): Promise<string> {
  const token = await signSession({
    slug: input.slug,
    role: input.role as 'staff' | 'owner' | 'guest' | 'member',
    email: input.email,
    orgId: input.orgId,
  });
  if (!token) throw new Error('signSession failed — check SESSION_SECRET / local secrets');
  return `${EA_PORTAL_COOKIE}=${token}`;
}

async function call(
  method: string,
  path: string,
  opts: { cookie?: string; body?: unknown } = {},
): Promise<{ status: number; text: string; json: Record<string, unknown> | null }> {
  const res = await fetch(`${base}${path}`, {
    method,
    redirect: 'manual',
    headers: {
      Accept: 'application/json,text/html',
      ...(opts.cookie ? { Cookie: opts.cookie } : {}),
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
}

function record(row: Row) {
  rows.push(row);
  console.log(`${row.pass ? 'PASS' : 'FAIL'} ${row.id} status=${row.status}`);
}

const staffCookie = await cookieFor({
  slug: 'demo-client',
  role: 'staff',
  email: 'staff.cert@example.test',
});
const guestCookie = await cookieFor({
  slug: 'demo-client',
  role: 'guest',
  email: 'guest.cert@example.test',
});
const otherSlugCookie = await cookieFor({
  slug: 'other-org-demo',
  role: 'owner',
  email: 'owner.other@example.test',
});

// Staff create in session org; body organizationId for foreign org must be ignored
{
  const bodyOrg = 'evil_org_should_be_ignored';
  const unique = `cert-${Date.now()}@example.test`;
  const res = await call('POST', '/api/portal/demo-client/people', {
    cookie: staffCookie,
    body: {
      organizationId: bodyOrg,
      displayName: 'Cert Ada',
      email: unique,
    },
  });
  const person = (res.json?.person as { organizationId?: string; id?: string; portalSlug?: string } | undefined) || null;
  const pass =
    res.status === 200 &&
    res.json?.ok === true &&
    !!person?.id &&
    person.organizationId !== bodyOrg &&
    person.portalSlug === 'demo-client';
  record({
    id: 'HTTP-AUTH-CREATE-BODY-ORG-IGNORED',
    route: '/api/portal/demo-client/people',
    method: 'POST',
    role: 'staff',
    slug: 'demo-client',
    expected: '200; portalSlug=demo-client; body organizationId ignored',
    status: res.status,
    bodySnippet: res.text.slice(0, 240),
    pass,
  });
}

// Guest cannot list
{
  const res = await call('GET', '/api/portal/demo-client/people', { cookie: guestCookie });
  record({
    id: 'HTTP-AUTH-GUEST-LIST-FORBIDDEN',
    route: '/api/portal/demo-client/people',
    method: 'GET',
    role: 'guest',
    slug: 'demo-client',
    expected: '403 Forbidden (role < staff)',
    status: res.status,
    bodySnippet: res.text.slice(0, 240),
    pass: res.status === 403,
  });
}

// Staff list ok
{
  const res = await call('GET', '/api/portal/demo-client/people', { cookie: staffCookie });
  const people = Array.isArray(res.json?.people) ? res.json.people : [];
  record({
    id: 'HTTP-AUTH-STAFF-LIST',
    route: '/api/portal/demo-client/people',
    method: 'GET',
    role: 'staff',
    slug: 'demo-client',
    expected: '200 with people array',
    status: res.status,
    bodySnippet: res.text.slice(0, 240),
    pass: res.status === 200 && res.json?.ok === true && people.length >= 1,
  });
}

// Cross-slug cookie on demo-client API → 403
{
  const res = await call('GET', '/api/portal/demo-client/people', { cookie: otherSlugCookie });
  record({
    id: 'HTTP-AUTH-CROSS-SLUG-DENIED',
    route: '/api/portal/demo-client/people',
    method: 'GET',
    role: 'owner@other-org-demo',
    slug: 'demo-client',
    expected: '403 portal access denied',
    status: res.status,
    bodySnippet: res.text.slice(0, 240),
    pass: res.status === 403,
  });
}

// Authenticated People page (flag ON) should render, not 404
{
  const res = await call('GET', '/portal/demo-client/people', { cookie: staffCookie });
  const html = res.text;
  const isPeopleShell = /Directory for portal/i.test(html) || /<h1[^>]*>\s*People\s*<\/h1>/i.test(html);
  const isLegalGate = /quiet look/i.test(html) || /LegalReacceptance|documents need/i.test(html);
  const isHard404 =
    res.status === 404 ||
    (/This page could not be found/i.test(html) && /404/i.test(html) && !isPeopleShell && !isLegalGate);
  const pass = res.status === 200 && (isPeopleShell || isLegalGate) && !isHard404;
  record({
    id: 'HTTP-AUTH-PAGE-RENDER',
    route: '/portal/demo-client/people',
    method: 'GET',
    role: 'staff',
    slug: 'demo-client',
    expected:
      '200 People shell, or portal legal gate in front of it (not People hard-404)',
    status: res.status,
    bodySnippet: html.replace(/\s+/g, ' ').slice(0, 200),
    pass,
  });
}

// Unauthenticated API still 401 (not silent 200)
{
  const res = await call('GET', '/api/portal/demo-client/people');
  record({
    id: 'HTTP-UNAUTH-API-401',
    route: '/api/portal/demo-client/people',
    method: 'GET',
    role: 'none',
    slug: 'demo-client',
    expected: '401',
    status: res.status,
    bodySnippet: res.text.slice(0, 240),
    pass: res.status === 401,
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  base,
  flag: 'ON (server env)',
  passCount: rows.filter((r) => r.pass).length,
  failCount: rows.filter((r) => !r.pass).length,
  rows,
};
writeFileSync(join(evidenceDir, 'http-auth-probes.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ passCount: summary.passCount, failCount: summary.failCount }, null, 2));
if (summary.failCount > 0) process.exit(1);
console.log('PASS people-http-auth');
process.exit(0);
