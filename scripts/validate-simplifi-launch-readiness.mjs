/**
 * Simplifi Launch Readiness — production validation (Phase 1).
 * Usage: node scripts/validate-simplifi-launch-readiness.mjs [baseUrl]
 *
 * Runs: health, Airtable schema, auth, full capture pipeline, magnifi/guidance,
 * decision intelligence, EA app host (app.efficiencyarchitects.online).
 * Simplifi is an EA product — no third-party brand-domain checks.
 */
import { fetchLaunchHealthDiagnostic, loadDotEnvLocal } from './lib/admin-bearer.mjs';

const BASE = (process.argv[2] || 'https://ea-payments.vercel.app').replace(/\/$/, '');
const SIMPLIFI_APP = process.env.SIMPLIFI_APP_URL || 'https://app.efficiencyarchitects.online';
const EMAIL = process.env.DEMO_CLIENT_EMAIL || 'demo@efficiencyarchitects.online';
const PASSWORD = process.env.DEMO_CLIENT_PASSWORD || 'DemoPulse2026!';
const env = loadDotEnvLocal();

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
  const healthRes = await fetchLaunchHealthDiagnostic(BASE, env);
  const health = healthRes.body;
  const diagnosticExpanded = Boolean(health?.checks);
  record('health-endpoint', healthRes.res.ok, { status: healthRes.res.status });

  // Public summary is `{ ok, status }` only. Local ADMIN_SESSION_SECRET often ≠ prod,
  // which previously false-failed products-simplifi / capture schema as "undefined".
  // Prefer expanded diagnostic; else use public readiness + direct Airtable meta check.
  let productsSimplifi = health?.checks?.products?.simplifi === true;
  let captureSchemaOk = health?.checks?.airtableSchema?.capture?.ok === true;
  let captureDetail = health?.checks?.airtableSchema?.capture?.tableName;

  if (!diagnosticExpanded) {
    const publicOk = health?.ok === true;
    const fullLaunch = health?.status === 'full_launch_ready';
    // Public ok already requires captureReady + demoClient + assessment path.
    productsSimplifi = publicOk;
    captureSchemaOk = publicOk && fullLaunch;
    captureDetail = 'public-summary-fallback';

    // Prefer authoritative Airtable meta when key + base id are available.
    if (env.AIRTABLE_API_KEY && env.AIRTABLE_PAYMENTS_BASE_ID) {
      try {
        const baseId = String(env.AIRTABLE_PAYMENTS_BASE_ID).trim();
        const metaRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
          headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}` },
        });
        const meta = await metaRes.json().catch(() => ({}));
        const capture = (meta.tables || []).find((t) => t.name === 'Capture Records');
        const required = [
          'Capture ID',
          'Title',
          'Description',
          'Capture Type',
          'Source',
          'Priority',
          'Status',
          'Date Captured',
          'Portal Slug',
          'Prospect Status',
        ];
        const names = new Set((capture?.fields || []).map((f) => f.name));
        const missing = required.filter((f) => !names.has(f));
        captureSchemaOk = Boolean(capture) && missing.length === 0;
        captureDetail = missing.length
          ? `missing:${missing.join(',')}`
          : capture?.name || 'Capture Records';
        // products.simplifi = captureReady && demoClient — public ok implies both when full_launch_ready
        productsSimplifi = captureSchemaOk && publicOk;
      } catch (err) {
        captureDetail = `meta-fallback-error:${err.message || err}`;
      }
    }
  }

  record('products-simplifi', productsSimplifi, {
    detail: diagnosticExpanded
      ? String(health?.checks?.products?.simplifi)
      : `fallback:${productsSimplifi}`,
  });
  record('airtable-capture-schema', captureSchemaOk, {
    detail: captureDetail,
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

  // Phase 6 — Amplifi hub auth-aware + Magnifi unavailable calm page
  const magnifiMissing = await fetchStatus(`${BASE}/magnifi/__ea_ops_probe_missing__`);
  let missingHtml = '';
  if (magnifiMissing.status === 200 && magnifiMissing.res) {
    missingHtml = await magnifiMissing.res.text();
  }
  record(
    'magnifi-unavailable-calm',
    magnifiMissing.status === 200 && /Story unavailable|Magnifi/i.test(missingHtml),
    { status: magnifiMissing.status },
  );

  const amplifiUnauth = await fetchStatus(`${BASE}/portal/demo-client/amplifi`);
  record(
    'amplifi-unauth-login-gate',
    (amplifiUnauth.status === 307 || amplifiUnauth.status === 308) &&
      /portal\/login/i.test(amplifiUnauth.res?.headers?.get('location') || ''),
    {
      status: amplifiUnauth.status,
      location: amplifiUnauth.res?.headers?.get('location'),
    },
  );

  let amplifiCookie = cookie;
  if (!amplifiCookie) {
    const enter = await fetch(`${BASE}/api/auth/demo-enter?next=${encodeURIComponent('/portal/demo-client/amplifi')}`, {
      redirect: 'manual',
    });
    amplifiCookie = cookieHeader(parseCookies(enter));
  }
  if (amplifiCookie) {
    const amplifiRes = await fetch(`${BASE}/portal/demo-client/amplifi`, {
      headers: { Cookie: amplifiCookie },
      redirect: 'follow',
    });
    const amplifiHtml = await amplifiRes.text();
    record(
      'amplifi-hub-authed',
      amplifiRes.ok && /Amplifi/i.test(amplifiHtml) && amplifiHtml.length > 4000,
      { status: amplifiRes.status, bytes: amplifiHtml.length },
    );
  } else {
    record('amplifi-hub-authed', false, { error: 'no portal session cookie' });
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

﻿  // 6. EA-owned Simplifi app host (primary) — must serve real product, not lander stub
  try {
    const eaOrb = await fetch(`${SIMPLIFI_APP}/simplifiorb`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    const eaOrbHtml = await eaOrb.text();
    const eaOrbOk =
      eaOrb.ok &&
      eaOrbHtml.length > 400 &&
      !eaOrbHtml.includes('/lander') &&
      /simplifi|capture|efficiency/i.test(eaOrbHtml);
    record('ea-app-host-orb', eaOrbOk, {
      status: eaOrb.status,
      url: `${SIMPLIFI_APP}/simplifiorb`,
      detail: eaOrbOk ? 'primary branded host ready' : 'EA app host not serving Simplifi Orb',
    });

    const eaCapture = await fetchStatus(`${SIMPLIFI_APP}/capture`);
    record('ea-app-host-capture', eaCapture.status === 200 || eaCapture.status === 307 || eaCapture.status === 308, {
      status: eaCapture.status,
      location: eaCapture.res?.headers?.get('location'),
      url: SIMPLIFI_APP,
    });
    record('ea-app-host-ssl', SIMPLIFI_APP.startsWith('https://'), { detail: SIMPLIFI_APP });
  } catch (err) {
    record('ea-app-host-orb', false, { error: String(err.message || err), url: SIMPLIFI_APP });
    record('ea-app-host-capture', false, { error: String(err.message || err) });
  }

  const failed = results.filter((r) => !r.ok);
  const productFailed = failed;
  const pass = productFailed.length === 0;
  const dnsPending = failed.some((f) => String(f.step).startsWith('ea-app-host-'));

  console.log('\n--- SUMMARY ---');
  console.log(
    JSON.stringify(
      {
        base: BASE,
        simplifiApp: SIMPLIFI_APP,
        pass,
        dnsPending,
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
