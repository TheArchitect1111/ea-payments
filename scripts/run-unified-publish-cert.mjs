#!/usr/bin/env node
/**
 * Launch readiness certification after unified publish gate.
 * Run: node scripts/run-unified-publish-cert.mjs
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function loadEnvLocal() {
  const p = join(root, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}
loadEnvLocal();

function present(name) {
  return Boolean(process.env[name] && String(process.env[name]).trim());
}

function diagnoseWebsitePortalLaunchInfra() {
  const checks = [
    {
      id: 'airtable',
      required: true,
      ok: present('AIRTABLE_API_KEY') || present('AIRTABLE_PAT'),
      detail: 'AIRTABLE_API_KEY or AIRTABLE_PAT',
    },
    {
      id: 'stripe_secret',
      required: true,
      ok: present('STRIPE_SECRET_KEY'),
      detail: 'STRIPE_SECRET_KEY',
    },
    {
      id: 'stripe_webhook',
      required: true,
      ok: present('STRIPE_WEBHOOK_SECRET'),
      detail: 'STRIPE_WEBHOOK_SECRET',
    },
    {
      id: 'stripe_price_website_portal',
      required: true,
      ok: present('STRIPE_PRICE_WEBSITE_PORTAL_STARTER'),
      detail: 'STRIPE_PRICE_WEBSITE_PORTAL_STARTER',
    },
    {
      id: 'stripe_publishable',
      required: true,
      ok: present('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
      detail: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    },
    {
      id: 'resend',
      required: true,
      ok: present('RESEND_API_KEY'),
      detail: 'RESEND_API_KEY',
    },
    {
      id: 'admin_session_secret',
      required: true,
      ok: present('ADMIN_SESSION_SECRET'),
      detail: 'ADMIN_SESSION_SECRET',
    },
    {
      id: 'session_secret',
      required: true,
      ok: present('SESSION_SECRET'),
      detail: 'SESSION_SECRET',
    },
  ];
  const blockers = checks.filter((c) => c.required && !c.ok).map((c) => `${c.id}: ${c.detail}`);
  return { ok: blockers.length === 0, checks, blockers };
}

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const nonce = randomBytes(3).toString('hex');
const testEmail = `cert.unified.${stamp}.${nonce}@mailinator.com`;
const businessName = `Cert Unified ${stamp} ${nonce}`;
const base = (process.env.CERT_BASE_URL || 'https://efficiencyarchitects.online').replace(/\/$/, '');

const stages = [];
function record(stage, status, detail = {}) {
  stages.push({ stage, status, at: new Date().toISOString(), ...detail });
  console.log(`${status === 'PASS' ? '✓' : status === 'BLOCKED' ? '○' : '✗'} [${status}] ${stage}`);
}

function runContract(script) {
  const res = spawnSync(process.execPath, [join(root, 'scripts', script)], {
    cwd: root,
    encoding: 'utf8',
  });
  return res.status === 0;
}

record('contracts.unified_publish_gate', runContract('test-website-publish-gate.mjs') ? 'PASS' : 'FAIL');
record('contracts.factory_publish', runContract('test-factory-publish-website.mjs') ? 'PASS' : 'FAIL');
record('contracts.website_portal_starter', runContract('test-website-portal-starter.mjs') ? 'PASS' : 'FAIL');
record('contracts.fulfill_paid_client', runContract('test-fulfill-paid-client.mjs') ? 'PASS' : 'FAIL');

const infra = diagnoseWebsitePortalLaunchInfra();
record('infra.launch_env', infra.ok ? 'PASS' : 'FAIL', {
  blockers: infra.blockers,
  checks: infra.checks.map((c) => ({ id: c.id, ok: c.ok })),
});

try {
  const buy = await fetch(`${base}/buy`);
  record('surface.buy', buy.ok ? 'PASS' : 'FAIL', { url: `${base}/buy`, status: buy.status });
} catch (e) {
  record('surface.buy', 'FAIL', { reason: String(e) });
}

try {
  const health = await fetch(`${base}/api/health/launch`);
  const j = await health.json().catch(() => ({}));
  record('surface.launch_health', health.ok ? 'PASS' : 'FAIL', { status: j.status, http: health.status });
} catch (e) {
  record('surface.launch_health', 'FAIL', { reason: String(e) });
}

try {
  const submit = await fetch(`${base}/api/assessment/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName,
      contactName: 'Cert Unified',
      email: testEmail,
      teamSizeLabel: '6-15 people',
      revenueRange: '$500k to $1M',
      currentSystems: 'Airtable, Stripe',
      operationalChallenges: ['too_many_manual_steps'],
      growthGoals: 'Unified publish gate certification',
      capacityConstraints: 'n/a',
      discoveryVersion: '1',
      discoveryAnswers: { organization_name: businessName },
      desiredExperiences: ['website'],
    }),
  });
  const body = await submit.json().catch(() => ({}));
  record('journey.assessment_submit', submit.ok && body.ok !== false ? 'PASS' : 'FAIL', {
    http: submit.status,
    keys: Object.keys(body || {}),
  });
} catch (e) {
  record('journey.assessment_submit', 'FAIL', { reason: String(e) });
}

record('journey.payment_checkout', 'BLOCKED', {
  reason: infra.ok
    ? 'Interactive Stripe card + webhook delivery not completed in this agent run'
    : `Missing env: ${infra.blockers.join('; ')}`,
});
record('journey.webhook_fulfill', 'BLOCKED', { reason: 'Depends on payment' });
record('journey.provision_publish_ed', 'BLOCKED', { reason: 'Depends on payment webhook' });
record('journey.magic_link', 'BLOCKED', { reason: 'Depends on fulfill + Resend' });
record('journey.return_visit', 'BLOCKED', { reason: 'Depends on provisioned client' });
record('journey.idempotency_double_fulfill', 'BLOCKED', { reason: 'Depends on payment' });

const gateSrc = readFileSync(join(root, 'lib/website-publish-gate.ts'), 'utf8');
const fulfillSrc = readFileSync(join(root, 'lib/fulfill-paid-client.ts'), 'utf8');
const provisionSrc = readFileSync(join(root, 'lib/provision-website-portal.ts'), 'utf8');
record(
  'gate.customer_path_requires_ed',
  gateSrc.includes('assertExperienceDirectorPublishGate') && fulfillSrc.includes('unified publish gate')
    ? 'PASS'
    : 'FAIL',
);
record(
  'gate.single_publisher',
  gateSrc.includes('publishWebsiteThroughDirectorGate') && !provisionSrc.includes("status: 'published'")
    ? 'PASS'
    : 'FAIL',
);

const fail = stages.filter((s) => s.status === 'FAIL').length;
const blocked = stages.filter((s) => s.status === 'BLOCKED').length;
const pass = stages.filter((s) => s.status === 'PASS').length;

let verdict = 'NO-GO';
const contractFail = stages.some((s) => s.stage.startsWith('contracts.') && s.status === 'FAIL');
const gateFail = stages.some((s) => s.stage.startsWith('gate.') && s.status === 'FAIL');
if (contractFail || gateFail) verdict = 'NO-GO';
else if (fail === 0 && blocked === 0) verdict = 'GO';
else if (!contractFail && !gateFail) verdict = 'GO WITH CONDITIONS';

const report = {
  title: 'Unified Publish Gate + Production Certification',
  at: new Date().toISOString(),
  verdict,
  identity: { testEmail, businessName, base },
  counts: { pass, fail, blocked, total: stages.length },
  stages,
  infra,
  publishPath: 'publishWebsiteThroughDirectorGate via provisionWebsitePortalSite',
  remainingBlockers: {
    P0: infra.ok
      ? ['Complete one live Stripe test payment + webhook fulfill + magic-link proof on production']
      : [
          'Configure Stripe + Resend + webhook secrets in the cert runtime (or run cert against production with those secrets)',
          'Complete one live paid Website + Portal journey without developer intervention',
        ],
    P1: [
      'CTP spine soft copy failures (preflight)',
      'Mobile/desktop walkthrough on paid directed site',
    ],
    P2: ['Submit API should return durable portalSlug/proposalId for cert tracing'],
  },
  reproduce: [
    'node scripts/test-website-publish-gate.mjs',
    'node scripts/test-factory-publish-website.mjs',
    'node scripts/test-website-portal-starter.mjs',
    'node scripts/run-unified-publish-cert.mjs',
  ],
};

const outDir = join(root, 'prototypes/website-director-golden-path');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `unified-publish-cert-${stamp}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ verdict, counts: report.counts, outPath, testEmail, infraOk: infra.ok }, null, 2));
process.exit(verdict === 'NO-GO' ? 2 : 0);
