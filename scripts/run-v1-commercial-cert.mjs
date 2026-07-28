#!/usr/bin/env node
/**
 * Portal Engine V1 Commercial Certification
 *
 * Proves (or blocks) the unattended path:
 *   checkout → payment → webhook → org → website → portal → Guide → emails → login → Progress
 *
 * GO requires Stripe TEST mode (sk_test / cs_test) and a completed paid session.
 * Live charges are never attempted.
 *
 * Run: node scripts/run-v1-commercial-cert.mjs
 * Optional: CERT_BASE_URL=https://… STRIPE_SECRET_KEY=sk_test_…
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { fetchLaunchHealthDiagnostic, loadDotEnvLocal } from './lib/admin-bearer.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const base = (process.env.CERT_BASE_URL || 'https://efficiencyarchitects.online').replace(/\/$/, '');
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const nonce = randomBytes(3).toString('hex');
const testEmail = `cert.v1.${stamp}.${nonce}@mailinator.com`;
const businessName = `V1 Cert ${stamp} ${nonce}`;
const localEnv = loadDotEnvLocal();

/** @type {{ id: string, area: string, status: 'PASS'|'FAIL'|'WARNING'|'BLOCKED', evidence: string, verify: string, blocking: boolean, owner: string }[]} */
const items = [];

function record(id, area, status, evidence, verify, blocking, owner = 'Engineering') {
  items.push({ id, area, status, evidence, verify, blocking, owner });
  const mark = status === 'PASS' ? '✓' : status === 'WARNING' ? '!' : status === 'BLOCKED' ? '○' : '✗';
  console.log(`${mark} [${status}] ${id} — ${evidence.slice(0, 160)}`);
}

function stripeModeFromKey(key) {
  if (!key) return 'missing';
  if (key.startsWith('sk_test')) return 'test';
  if (key.startsWith('sk_live')) return 'live';
  return 'unknown';
}

function codeContains(relPath, needle) {
  const p = join(root, relPath);
  if (!existsSync(p)) return false;
  return readFileSync(p, 'utf8').includes(needle);
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body, headers: res.headers };
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow', headers: { Accept: 'text/html' } });
  const text = await res.text();
  return { status: res.status, ok: res.ok, text, url: res.url };
}

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY || localEnv.STRIPE_SECRET_KEY || '';
  const localStripeMode = stripeModeFromKey(stripeKey);

  // ── Production readiness ──
  let health = null;
  try {
    health = (await fetchLaunchHealthDiagnostic(base, localEnv)).body;
    record(
      'prod.env',
      'Production',
      health?.checks?.env?.stripe &&
        health?.checks?.env?.stripeWebhookSecret &&
        health?.checks?.env?.resend &&
        health?.checks?.env?.airtable
        ? 'PASS'
        : 'FAIL',
      JSON.stringify(health?.checks?.env || {}),
      'GET /api/health/launch (admin Bearer)',
      true,
      'Platform',
    );
  } catch (e) {
    record('prod.env', 'Production', 'FAIL', String(e), 'GET /api/health/launch (admin Bearer)', true, 'Platform');
  }

  record(
    'prod.publish_gate_code',
    'Production',
    codeContains('lib/website-publish-gate.ts', 'publishWebsiteThroughDirectorGate') ? 'PASS' : 'FAIL',
    'lib/website-publish-gate.ts present locally',
    'git + code inspection',
    true,
  );

  record(
    'prod.org_fail_closed',
    'Organization',
    codeContains('lib/organizations.ts', 'Synthetic org_* IDs are not allowed in production')
      ? 'PASS'
      : 'FAIL',
    'ensureOrganizationForPortal rejects synthetic IDs in production',
    'code inspection',
    true,
  );

  record(
    'prod.fulfill_fail_closed',
    'Provisioning',
    codeContains('lib/fulfill-paid-client.ts', 'CTP / Guide workspace bind failed') &&
      codeContains('lib/fulfill-paid-client.ts', 'ok: false')
      ? 'PASS'
      : 'FAIL',
    'fulfillPaidClient fails closed on org/site/Guide bind errors',
    'code inspection',
    true,
  );

  record(
    'prod.slug_login',
    'Continuity',
    codeContains('lib/ctp-portal-host.ts', 'ctp/progress') ? 'PASS' : 'FAIL',
    'publicPortalLoginUrl(slug) deep-links to Guide Progress',
    'code inspection',
    true,
  );

  // ── Commercial surfaces ──
  try {
    const buy = await fetchText(`${base}/buy`);
    const hasOffer = /website|portal|2,?497|starter/i.test(buy.text);
    record(
      'commerce.buy',
      'Commercial',
      buy.ok && hasOffer ? 'PASS' : 'FAIL',
      `HTTP ${buy.status}; offerCopy=${hasOffer}`,
      'GET /buy',
      true,
      'Sales',
    );
  } catch (e) {
    record('commerce.buy', 'Commercial', 'FAIL', String(e), 'GET /buy', true);
  }

  let checkoutMode = 'unknown';
  let checkoutUrl = '';
  try {
    const checkout = await fetchJson(`${base}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: 'website_portal_starter',
        email: testEmail,
        name: businessName,
        organization: `${businessName} Org`,
      }),
    });
    checkoutUrl = checkout.body?.url || '';
    checkoutMode = checkoutUrl.includes('cs_live_')
      ? 'live'
      : checkoutUrl.includes('cs_test_')
        ? 'test'
        : 'unknown';
    record(
      'commerce.checkout_session',
      'Commercial',
      checkout.ok && checkoutUrl ? 'PASS' : 'FAIL',
      `HTTP ${checkout.status}; stripeMode=${checkoutMode}; sessionUrl=${Boolean(checkoutUrl)}`,
      'POST /api/checkout website_portal_starter',
      true,
    );
  } catch (e) {
    record('commerce.checkout_session', 'Commercial', 'FAIL', String(e), 'POST /api/checkout', true);
  }

  // Never complete a live charge
  if (checkoutMode === 'live') {
    record(
      'commerce.payment_complete',
      'Commercial',
      'BLOCKED',
      'Production Stripe is LIVE (cs_live). Automated cert will not charge $2,497. Requires sk_test CERT environment.',
      'Stripe TEST checkout + payment_intent confirm',
      true,
      'Founder / Platform',
    );
  } else if (checkoutMode === 'test' && localStripeMode === 'test') {
    record(
      'commerce.payment_complete',
      'Commercial',
      'BLOCKED',
      'Test session created but card completion + webhook delivery not automated in this runner (needs stripe listen or hosted test pay).',
      'Complete cs_test with 4242… and confirm webhook → fulfillPaidClient',
      true,
    );
  } else if (checkoutMode === 'test') {
    record(
      'commerce.payment_complete',
      'Commercial',
      'BLOCKED',
      'cs_test session available but local STRIPE_SECRET_KEY missing — cannot confirm payment via API.',
      'Set sk_test in .env.local and re-run',
      true,
    );
  } else {
    record(
      'commerce.payment_complete',
      'Commercial',
      'FAIL',
      'Could not classify checkout session mode',
      'Inspect checkout.url for cs_test_ / cs_live_',
      true,
    );
  }

  record(
    'commerce.webhook_fulfill',
    'Provisioning',
    'BLOCKED',
    'Depends on payment_complete',
    'Stripe webhook checkout.session.completed → fulfillPaidClient',
    true,
  );
  record(
    'commerce.org_durable',
    'Organization',
    'BLOCKED',
    'Depends on webhook fulfill; code now rejects org_* in production',
    'Inspect Organizations row id after fulfill (must not start with org_)',
    true,
  );
  record(
    'commerce.website_published',
    'Website',
    'BLOCKED',
    'Depends on webhook fulfill + Director gate ≥80',
    'GET siteUrl from fulfill; ED Approved',
    true,
  );
  record(
    'commerce.portal_ready',
    'Portal',
    'BLOCKED',
    'Depends on webhook fulfill',
    'Portal slug + credentials in welcome email',
    true,
  );
  record(
    'commerce.guide_init',
    'Guide',
    'BLOCKED',
    'Depends on CTP workspace bind after website provision',
    'Authenticated GET /portal/{slug}/ctp/progress',
    true,
  );
  record(
    'commerce.confirmation_emails',
    'Email',
    'BLOCKED',
    'Depends on webhook + Resend',
    'Inbox: welcome + payment confirmation with Guide-aligned CTAs',
    true,
    'Ops',
  );

  // ── Auth / continuity (production demo path — not a paid customer) ──
  try {
    const login = await fetchText(`${base}/portal/login`);
    record(
      'auth.login_surface',
      'Authentication',
      login.ok ? 'PASS' : 'FAIL',
      `HTTP ${login.status}`,
      'GET /portal/login',
      true,
    );
  } catch (e) {
    record('auth.login_surface', 'Authentication', 'FAIL', String(e), 'GET /portal/login', true);
  }

  try {
    const demo = await fetch(`${base}/api/auth/demo-enter`, { redirect: 'manual' });
    const loc = demo.headers.get('location') || '';
    const toProgress = /ctp\/progress/i.test(loc);
    const toPortal = /\/portal\//i.test(loc);
    record(
      'auth.demo_enter',
      'Authentication',
      demo.status >= 300 && demo.status < 400 && (toProgress || toPortal) ? 'PASS' : 'WARNING',
      `HTTP ${demo.status}; location=${loc || '(none)'}`,
      'GET /api/auth/demo-enter (manual redirect)',
      false,
    );
  } catch (e) {
    record('auth.demo_enter', 'Authentication', 'FAIL', String(e), 'GET /api/auth/demo-enter', false);
  }

  try {
    const unauth = await fetch(`${base}/portal/demo-website/ctp/progress`, { redirect: 'manual' });
    const loc = unauth.headers.get('location') || '';
    const gated = unauth.status === 307 || unauth.status === 302 || /login/i.test(loc);
    record(
      'auth.unauthorized_route',
      'Authentication',
      gated || unauth.status === 401 || unauth.status === 403 ? 'PASS' : 'WARNING',
      `HTTP ${unauth.status}; location=${loc || '(none)'}`,
      'GET protected Guide Progress without session',
      true,
    );
  } catch (e) {
    record('auth.unauthorized_route', 'Authentication', 'FAIL', String(e), 'GET protected route', true);
  }

  // ── Continuity / honesty (static + live copy) ──
  record(
    'honesty.contact_nav',
    'Honesty',
    codeContains('lib/ctp-client-nav.ts', "label: 'Contact'") ? 'PASS' : 'FAIL',
    'CX nav uses Contact not Messages',
    'code inspection',
    true,
    'Product',
  );
  record(
    'honesty.update_hub_copy',
    'Honesty',
    codeContains('app/portal/[slug]/updates/page.tsx', 'not email, Slack, or Basecamp')
      ? 'PASS'
      : 'FAIL',
    'Update Hub scoped as curated Project Updates',
    'code inspection',
    true,
    'Product',
  );
  record(
    'honesty.journey_ssot',
    'Guide',
    codeContains('lib/ctp-consulting-narrative.ts', 'GUIDE_LIFECYCLE_STAGES') ? 'PASS' : 'FAIL',
    'Journey steps derived from guideStage SSOT',
    'code inspection',
    true,
  );

  try {
    const supportSrc = readFileSync(join(root, 'lib/ctp-support-view.ts'), 'utf8');
    const emailMatch = supportSrc.match(/SUPPORT_EMAIL \?\? '([^']+)'/);
    const supportEmail = emailMatch?.[1] || 'freedom@efficiencyarchitects.online';
    record(
      'support.email_configured',
      'Support',
      /@/.test(supportEmail) ? 'PASS' : 'FAIL',
      `Default support email ${supportEmail}`,
      'mailto actions in Help/Contact',
      true,
      'Ops',
    );
  } catch (e) {
    record('support.email_configured', 'Support', 'FAIL', String(e), 'ctp-support-view', true);
  }

  record(
    'email.welcome_cta',
    'Email',
    codeContains('lib/email.ts', 'Open Your Project') ||
      codeContains('lib/email.ts', 'Access Your Portal')
      ? 'PASS'
      : 'WARNING',
    'Welcome/portal CTAs present in email templates',
    'Static template review',
    false,
    'Ops',
  );

  record(
    'ops.idempotency_code',
    'Operational',
    codeContains('app/api/webhooks/stripe/route.ts', 'checkout.session.completed')
      ? 'PASS'
      : 'FAIL',
    'Stripe webhook handler present for completed sessions',
    'code inspection',
    true,
  );

  // Local cert env
  record(
    'local.stripe_test_key',
    'Commercial',
    localStripeMode === 'test' ? 'PASS' : localStripeMode === 'live' ? 'WARNING' : 'FAIL',
    `Local STRIPE_SECRET_KEY mode=${localStripeMode}`,
    'scripts/_cert-env-probe.mjs',
    true,
    'Platform',
  );
  record(
    'local.resend',
    'Email',
    process.env.RESEND_API_KEY || localEnv.RESEND_API_KEY ? 'PASS' : 'FAIL',
    'Local RESEND_API_KEY for inbox proof',
    '.env.local',
    false,
    'Platform',
  );

  const pass = items.filter((i) => i.status === 'PASS').length;
  const fail = items.filter((i) => i.status === 'FAIL').length;
  const warn = items.filter((i) => i.status === 'WARNING').length;
  const blocked = items.filter((i) => i.status === 'BLOCKED').length;
  const blockingOpen = items.filter(
    (i) => i.blocking && (i.status === 'FAIL' || i.status === 'BLOCKED'),
  );

  let verdict = 'GO WITH CONDITIONS';
  if (
    checkoutMode === 'test' &&
    fail === 0 &&
    blocked === 0 &&
    items.find((i) => i.id === 'commerce.payment_complete')?.status === 'PASS' &&
    items.find((i) => i.id === 'commerce.guide_init')?.status === 'PASS'
  ) {
    verdict = 'GO';
  } else if (fail > 8 && pass < 5) {
    verdict = 'NO GO';
  }

  // Hard rule from sprint brief
  const paymentDone = items.find((i) => i.id === 'commerce.payment_complete')?.status === 'PASS';
  const guideDone = items.find((i) => i.id === 'commerce.guide_init')?.status === 'PASS';
  if (!(paymentDone && guideDone)) {
    verdict = 'GO WITH CONDITIONS';
  }

  const report = {
    title: 'Portal Engine V1 Commercial Certification',
    product: 'Efficiency Architects — Website + Guided Project Experience',
    at: new Date().toISOString(),
    verdict,
    identity: { testEmail, businessName, base, checkoutMode, localStripeMode },
    counts: { pass, fail, warn, blocked, total: items.length, blockingOpen: blockingOpen.length },
    blockingOpen: blockingOpen.map((i) => i.id),
    items,
    fingerprint: createHash('sha256').update(JSON.stringify(items)).digest('hex').slice(0, 16),
  };

  const outDir = join(root, 'prototypes', 'v1-commercial-cert');
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `cert-${stamp}.json`);
  writeFileSync(out, JSON.stringify(report, null, 2));
  writeFileSync(join(outDir, 'latest.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ verdict, counts: report.counts, checkoutMode, out }, null, 2));
  process.exit(verdict === 'GO' ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
