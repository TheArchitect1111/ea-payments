/**
 * Simplifi Launch Readiness — production validation (Phase 1).
 * Usage: node scripts/validate-simplifi-launch-readiness.mjs [baseUrl]
 *
 * Runs: health, Airtable schema, auth, full capture pipeline, magnifi/guidance,
 * decision intelligence, app.simplifi.ai DNS/SSL (when resolvable).
 */
const BASE = (process.argv[2] || 'https://ea-payments.vercel.app').replace(/\/$/, '');
const SIMPLIFI_APP = process.env.SIMPLIFI_APP_URL || 'https://app.simplifi.ai';
const EMAIL = process.env.DEMO_CLIENT_EMAIL || 'demo@efficiencyarchitects.online';
const PASSWORD = process.env.DEMO_CLIENT_PASSWORD || 'DemoPulse2026!';

const results = [];
function record(step, ok, extra = {}) {
  results.push({ step, ok, ...extra });
  console.log(ok ? '✓' : '✗', step, extra.detail || extra.error || '');
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

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function fetchStatus(url, init) {
  try {
    const res = await fetch(url, { ...init, redirect: 'manual' });
    return { status: res.status, res };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function main() {
  console.log('Simplifi Launch Readiness —', BASE, '\n');

  // 1. Health + Airtable + products.simplifi
  const healthRes = await fetch(`${BASE}/api/health/launch`);
  const health = await healthRes.json().catch(() => ({}));
  record('health-endpoint', healthRes.ok, { status: healthRes.status });
  record('products-simplifi', health?.checks?.products?.simplifi === true, {
    detail: String(health?.checks?.products?.simplifi),
  });
  record('airtable-capture-schema', health?.checks?.airtableSchema?.capture?.ok === true, {
    detail: health?.checks?.airtableSchema?.capture?.tableName,
  });

  // 2. Auth — portal login
  const loginRes = await fetch(`${BASE}/api/portal/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  let cookies = parseCookies(loginRes);
  record('portal-login', loginRes.ok && loginBody.slug, { slug: loginBody.slug, error: loginBody.error });

  // Demo session fallback
  if (!loginRes.ok) {
    const demoRes = await fetch(`${BASE}/api/demo/session`, { method: 'POST' });
    const demoBody = await demoRes.json().catch(() => ({}));
    if (demoRes.ok && demoBody.ok) {
      cookies = parseCookies(demoRes);
      record('demo-provisioning', true, { slug: demoBody.slug, detail: 'demo session fallback' });
    } else {
      record('demo-provisioning', false, { error: demoBody.error || demoRes.status });
    }
  } else {
    record('demo-provisioning', true, { detail: 'portal login succeeded' });
  }

  const cookie = cookieHeader(cookies);

  // Simplifi login page reachable
  const simplifiLogin = await fetchStatus(`${BASE}/simplifi/login`);
  record('simplifi-login-page', simplifiLogin.status === 200, { status: simplifiLogin.status });

  // 3. Capture pipeline
  const analyzeRes = await fetch(`${BASE}/api/portal/captures/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      url: 'https://example.com',
      notes: 'Simplifi launch readiness validation',
      async: false,
    }),
  });
  const analyzeBody = await analyzeRes.json().catch(() => ({}));
  const recordId = analyzeBody.recordId ?? analyzeBody.record?.id ?? analyzeBody.captureId;
  record('capture-analyze', analyzeRes.ok && Boolean(recordId), {
    recordId,
    status: analyzeBody.status ?? analyzeBody.record?.status,
    error: analyzeBody.error,
  });

  const magnifiPath = analyzeBody.magnifiUrl || (recordId ? `/magnifi/${recordId}` : null);
  const guidancePath = analyzeBody.guidanceUrl || (recordId ? `/simplifi/guidance/${recordId}` : null);

  record('capture-persist', Boolean(recordId), { detail: recordId ? 'Airtable record id returned' : 'missing id' });

  if (magnifiPath) {
    const magnifi = await fetchStatus(`${BASE}${magnifiPath}`);
    const magnifiOk = magnifi.status === 200 || magnifi.status === 307;
    record('magnifi-reachable', magnifiOk, { path: magnifiPath, status: magnifi.status });
  } else {
    record('magnifi-reachable', false, { error: 'no magnifiUrl' });
  }

  if (guidancePath) {
    const guidance = await fetchStatus(`${BASE}${guidancePath}`);
    record('guidance-reachable', guidance.status === 200, { path: guidancePath, status: guidance.status });
  } else {
    record('guidance-reachable', false, { error: 'no guidanceUrl' });
  }

  // 4. Decision intelligence (new capture)
  if (recordId && cookie) {
    const intelRes = await fetch(`${BASE}/api/portal/captures/${recordId}/intelligence`, {
      headers: { Cookie: cookie },
    });
    const intelBody = await intelRes.json().catch(() => ({}));
    const decision = intelBody.intelligence?.decision ?? intelBody.decision;
    const path = decision?.recommendedPath ?? decision?.path;
    record('decision-intelligence', intelRes.ok && Boolean(path), {
      recommendedPath: path,
      status: intelRes.status,
      error: intelBody.error,
    });
  } else {
    record('decision-intelligence', false, { error: 'no record or session' });
  }

  // 5. Middleware aliases on primary host
  const captureAlias = await fetchStatus(`${BASE}/capture`);
  record('middleware-capture-alias', captureAlias.status === 307 || captureAlias.status === 308, {
    status: captureAlias.status,
    location: captureAlias.res?.headers?.get('location'),
  });

  const appAlias = await fetchStatus(`${BASE}/app`);
  record('middleware-app-alias', appAlias.status === 307 || appAlias.status === 308, {
    status: appAlias.status,
    location: appAlias.res?.headers?.get('location'),
  });

  // 5b. Goal B Pass 3/4 — Magnifi print + extension session + watch list
  if (recordId && cookie) {
    const printRes = await fetch(`${BASE}/api/portal/captures/${recordId}/print`, {
      headers: { Cookie: cookie },
    });
    const printHtml = await printRes.text();
    record('magnifi-print-pack', printRes.ok && printHtml.includes('Magnifi'), {
      status: printRes.status,
      contentType: printRes.headers.get('content-type'),
    });

    const bootRes = await fetch(`${BASE}/api/extension/bootstrap`, {
      headers: { Cookie: cookie },
    });
    const boot = await bootRes.json().catch(() => ({}));
    record('extension-bootstrap-token', Boolean(boot.ok && boot.extensionToken && boot.tokenExpiresAt && !boot.apiKey), {
      status: bootRes.status,
      hasToken: Boolean(boot.extensionToken),
      hasApiKey: Boolean(boot.apiKey),
    });

    if (boot.extensionToken) {
      const watchRes = await fetch(`${BASE}/api/extension/watch-list`, {
        headers: {
          Cookie: cookie,
          Authorization: `Bearer ${boot.extensionToken}`,
          'X-EA-Extension-Token': boot.extensionToken,
        },
      });
      const watch = await watchRes.json().catch(() => ({}));
      record('extension-watch-list', Boolean(watch.ok && Array.isArray(watch.items)), {
        status: watchRes.status,
        count: Array.isArray(watch.items) ? watch.items.length : undefined,
        error: watch.error,
      });
    } else {
      record('extension-watch-list', false, { error: 'No extension token from bootstrap' });
    }
  }

  // 6. app.simplifi.ai DNS / SSL / redirects
  let simplifiAppDns = false;
  try {
    const appRoot = await fetchStatus(`${SIMPLIFI_APP}/`);
    simplifiAppDns = appRoot.status > 0;
    record('app-simplifi-dns', simplifiAppDns, { status: appRoot.status, error: appRoot.error });
    if (simplifiAppDns) {
      const appCapture = await fetchStatus(`${SIMPLIFI_APP}/capture`);
      record('app-simplifi-capture-redirect', appCapture.status === 307 || appCapture.status === 308, {
        status: appCapture.status,
        location: appCapture.res?.headers?.get('location'),
      });
      record('app-simplifi-ssl', SIMPLIFI_APP.startsWith('https://'), { detail: SIMPLIFI_APP });
    }
  } catch (err) {
    record('app-simplifi-dns', false, { error: String(err.message || err) });
  }

  const failed = results.filter((r) => !r.ok);
  // DNS is operator-owned — report separately so Goal B product checks can still pass.
  const productFailed = failed.filter((f) => f.step !== 'app-simplifi-dns' && !String(f.step).startsWith('app-simplifi-'));
  const pass = productFailed.length === 0;

  console.log('\n--- SUMMARY ---');
  console.log(
    JSON.stringify(
      {
        base: BASE,
        simplifiApp: SIMPLIFI_APP,
        pass,
        dnsPending: failed.some((f) => String(f.step).startsWith('app-simplifi')),
        failedSteps: failed.map((f) => f.step),
        productFailedSteps: productFailed.map((f) => f.step),
        recordId,
        magnifiPath,
        guidancePath,
        results,
      },
      null,
      2,
    ),
  );

  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
