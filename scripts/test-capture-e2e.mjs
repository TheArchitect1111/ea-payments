/**
 * Production capture E2E smoke test (portal login → URL capture → record saved).
 * Usage: node scripts/test-capture-e2e.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'https://ea-payments.vercel.app';
const EMAIL = 'demo@efficiencyarchitects.online';
const PASSWORD = 'DemoPulse2026!';

function parseCookies(res) {
  const jar = new Map();
  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  const lines = raw.length ? raw : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
  for (const header of lines) {
    if (!header) continue;
    const part = header.split(';')[0];
    const i = part.indexOf('=');
    if (i > 0) jar.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

console.log('Capture E2E —', BASE);

const loginRes = await fetch(`${BASE}/api/portal/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});

const loginBody = await loginRes.json();
if (!loginRes.ok) {
  console.error('LOGIN FAIL', loginRes.status, loginBody);
  process.exit(1);
}
console.log('LOGIN OK slug:', loginBody.slug ?? 'demo-client');

const cookies = parseCookies(loginRes);
const session = cookies.get('ea_portal_session');
if (!session) {
  console.error('LOGIN FAIL — no session cookie');
  process.exit(1);
}

const analyzeRes = await fetch(`${BASE}/api/portal/captures/analyze`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: cookieHeader(cookies),
  },
  body: JSON.stringify({
    url: 'https://example.com',
    notes: 'Launch readiness E2E test',
    async: false,
  }),
});

const analyzeText = await analyzeRes.text();
let analyzeBody;
try {
  analyzeBody = JSON.parse(analyzeText);
} catch {
  analyzeBody = { raw: analyzeText.slice(0, 500) };
}

console.log('CAPTURE STATUS', analyzeRes.status);
if (!analyzeRes.ok) {
  console.error('CAPTURE FAIL', analyzeBody);
  process.exit(1);
}

const recordId = analyzeBody.recordId ?? analyzeBody.record?.id;
const magnifiUrl = analyzeBody.magnifiUrl ?? analyzeBody.links?.magnifiUrl;
const status = analyzeBody.status ?? analyzeBody.record?.status;

console.log('recordId:', recordId || '(missing)');
console.log('status:', status || '(missing)');
console.log('magnifiUrl:', magnifiUrl ? 'yes' : 'no');
console.log('error field:', analyzeBody.error ?? 'none');

if (!recordId) {
  console.error('CAPTURE FAIL — no record id returned');
  process.exit(1);
}

if (analyzeBody.error) {
  console.error('CAPTURE FAIL —', analyzeBody.error);
  process.exit(1);
}

console.log('\nPASS — capture saved to Airtable and pipeline responded.');
