/**
 * Flag OFF authenticated probes — expect hard 404 on People surfaces.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

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

const token = await signSession({
  slug: 'demo-client',
  role: 'owner',
  email: 'owner.cert@example.test',
});
const cookie = `${EA_PORTAL_COOKIE}=${token}`;

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${base}${path}`, {
    method,
    redirect: 'manual',
    headers: {
      Cookie: cookie,
      Accept: 'application/json,text/html',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  return { status: res.status, text };
}

const rows = [];

{
  const res = await call('GET', '/api/portal/demo-client/people');
  rows.push({
    id: 'FLAG-OFF-AUTH-API-GET',
    status: res.status,
    expected: 404,
    pass: res.status === 404,
    body: res.text.slice(0, 160),
  });
}
{
  const res = await call('POST', '/api/portal/demo-client/people', {
    displayName: 'Should Not Create',
  });
  rows.push({
    id: 'FLAG-OFF-AUTH-API-POST',
    status: res.status,
    expected: 404,
    pass: res.status === 404,
    body: res.text.slice(0, 160),
  });
}
{
  const res = await call('GET', '/api/portal/demo-client/people/merge');
  rows.push({
    id: 'FLAG-OFF-AUTH-API-MERGE-GET',
    status: res.status,
    expected: 404,
    pass: res.status === 404,
    body: res.text.slice(0, 160),
  });
}
{
  const res = await call('GET', '/api/portal/demo-client/people/import');
  rows.push({
    id: 'FLAG-OFF-AUTH-API-IMPORT-GET',
    status: res.status,
    expected: 404,
    pass: res.status === 404,
    body: res.text.slice(0, 160),
  });
}
{
  const res = await call('GET', '/api/portal/demo-client/people/export');
  rows.push({
    id: 'FLAG-OFF-AUTH-API-EXPORT',
    status: res.status,
    expected: 404,
    pass: res.status === 404,
    body: res.text.slice(0, 160),
  });
}
{
  const res = await call('GET', '/portal/demo-client/people');
  const isPeopleShell = /Directory for portal/i.test(res.text);
  const is404 =
    res.status === 404 ||
    (/This page could not be found/i.test(res.text) && /404/i.test(res.text));
  // Legal gate may still wrap portal; People shell must not appear when flag OFF.
  rows.push({
    id: 'FLAG-OFF-AUTH-PAGE',
    status: res.status,
    expected: '404 or legal gate without People shell (never Directory for portal)',
    pass: !isPeopleShell && (is404 || res.status === 200 || res.status === 307),
    body: res.text.replace(/\s+/g, ' ').slice(0, 200),
    notes: { isPeopleShell, is404 },
  });
}
{
  const res = await call('GET', '/portal/demo-client/ctp/progress');
  rows.push({
    id: 'FLAG-OFF-CTP-UNCHANGED',
    status: res.status,
    expected: 'not 404 from People (307/200/legal gate ok)',
    pass: res.status !== 404,
    body: res.text.replace(/\s+/g, ' ').slice(0, 120),
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  base,
  flag: 'OFF (UNIVERSAL_PEOPLE=0)',
  passCount: rows.filter((r) => r.pass).length,
  failCount: rows.filter((r) => !r.pass).length,
  rows,
};
writeFileSync(join(evidenceDir, 'http-flag-off-auth-probes.json'), JSON.stringify(summary, null, 2));
for (const r of rows) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} status=${r.status}`);
console.log(JSON.stringify({ passCount: summary.passCount, failCount: summary.failCount }, null, 2));
process.exit(summary.failCount > 0 ? 1 : 0);
