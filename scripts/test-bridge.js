// V3.1 live Preview API verification. Never forge EA sessions or mark skipped checks PASS.
// Usage: EA_PORTAL_COOKIE_NAME=<name> EA_PORTAL_SESSION_COOKIE=<valid synthetic session value> node scripts/test-bridge.js
const PREVIEW = process.env.BRIDGE_PREVIEW_URL ?? 'https://ea-payments-git-poc-ama-b13cfd-the-architects-projects-cc813778.vercel.app';
const cookieName = process.env.EA_PORTAL_COOKIE_NAME;
const session = process.env.EA_PORTAL_SESSION_COOKIE;
const courseId = 'wood-therapy-certification';
const results = [];
const assert = (ok, message) => { if (!ok) throw new Error(message); };
async function post(path, body, cookie) {
  const response = await fetch(PREVIEW + path, {
    method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body), redirect: 'manual',
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}
async function check(name, fn) {
  try { await fn(); results.push([name, 'PASS']); console.log('PASS', name); }
  catch (e) { results.push([name, 'FAIL']); console.error('FAIL', name, e.message); }
}
await check('Unsigned or tampered token returns 401', async () => {
  const r = await post('/api/frappe-bridge/verify', {token: 'a.b.c'});
  assert(r.status === 401, 'expected 401; got ' + r.status);
});
if (!cookieName || !session) {
  console.error('BLOCKED: a real authenticated synthetic EA Preview session is required for signed-token tests.');
  process.exitCode = 2;
} else {
  const cookie = cookieName + '=' + session;
  let token;
  await check('Authorized synthetic token mint', async () => {
    const r = await post('/api/frappe-bridge/token', {courseId}, cookie);
    assert(r.status === 200 && typeof r.body.token === 'string', JSON.stringify(r));
    token = r.body.token;
  });
  if (token) {
    await check('Tampered signed token returns 401 Invalid signature', async () => {
      const parts = token.split('.');
      const chars = parts[1].split('');
      chars[0] = chars[0] === 'a' ? 'b' : 'a';
      parts[1] = chars.join('');
      const r = await post('/api/frappe-bridge/verify', {token: parts.join('.')});
      assert(r.status === 401 && r.body.error === 'Invalid signature', JSON.stringify(r));
    });
    await check('Valid signed token returns 200', async () => {
      const r = await post('/api/frappe-bridge/verify', {token});
      assert(r.status === 200 && r.body.courseAccess, JSON.stringify(r));
    });
    await check('Replayed signed token returns 401', async () => {
      const r = await post('/api/frappe-bridge/verify', {token});
      assert(r.status === 401 && r.body.error === 'Token replay detected', JSON.stringify(r));
    });
    if (process.env.WAIT_FOR_EXPIRY === '1') {
      await new Promise(resolve => setTimeout(resolve, 305000));
      await check('Expired signed token returns 401 Token expired', async () => {
        const r = await post('/api/frappe-bridge/verify', {token});
        assert(r.status === 401 && r.body.error === 'Token expired', JSON.stringify(r));
      });
    } else {
      console.log('NOT RUN: expiration requires WAIT_FOR_EXPIRY=1 (wait 305 sec) and a newly minted unused token.');
    }
  }
}
console.log(JSON.stringify({preview: PREVIEW, results}, null, 2));
if (results.some(([, status]) => status !== 'PASS')) process.exitCode = 1;
