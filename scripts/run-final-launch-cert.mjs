#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fetchLaunchHealthDiagnostic, loadDotEnvLocal } from './lib/admin-bearer.mjs';

const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: process.cwd() }).trim();
  } catch (e) {
    return `ERR: ${e.message}`;
  }
};

const stamp = new Date().toISOString();
const commit = sh('git rev-parse HEAD');
const short = sh('git rev-parse --short HEAD');
const status = sh('git status -sb');
const untracked = sh('git status --porcelain');
const hasGateFile = sh('git ls-files lib/website-publish-gate.ts');
const gateInHead = sh('git show HEAD:lib/website-publish-gate.ts 2>&1 | head -c 80');
const env = loadDotEnvLocal();

// Production env from health (no secrets)
const health = (await fetchLaunchHealthDiagnostic('https://efficiencyarchitects.online', env)).body;
const fulfill = await fetch(
  'https://efficiencyarchitects.online/api/health/package-fulfillment',
).then((r) => r.json());

const envOk = Boolean(
  health?.checks?.env?.stripe &&
    health?.checks?.env?.stripeWebhookSecret &&
    health?.checks?.env?.resend &&
    health?.checks?.env?.resendFrom &&
    health?.checks?.env?.airtable &&
    fulfill?.env?.stripeSecret &&
    fulfill?.env?.stripeWebhookSecret &&
    fulfill?.env?.resend,
);

// Probe checkout mode
const email = `cert.final.stop.${Date.now()}@mailinator.com`;
const checkout = await fetch('https://efficiencyarchitects.online/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    packageId: 'website_portal_starter',
    email,
    name: 'Final Cert Stop',
    organization: 'Final Cert Stop Org',
  }),
}).then(async (r) => ({ status: r.status, ...(await r.json().catch(() => ({}))) }));

const stripeMode = checkout.url?.includes('cs_live_')
  ? 'live'
  : checkout.url?.includes('cs_test_')
    ? 'test'
    : 'unknown';

const gateDeployed = Boolean(hasGateFile) && !String(gateInHead).startsWith('ERR');
const dirty = Boolean(untracked && untracked.length);

const failures = [];
if (!envOk) failures.push('Production env incomplete (Stripe/Resend/Airtable)');
if (stripeMode === 'live') {
  failures.push(
    'Production Stripe is LIVE (cs_live). Automated certification cannot complete a real $2,497 charge without authorized payment. Test-mode cert environment required, or human completes live checkout.',
  );
}
if (!gateDeployed || dirty || String(status).includes('website-publish-gate')) {
  // Check if gate exists only as untracked
  if (!hasGateFile || hasGateFile.startsWith('ERR') || !hasGateFile.includes('website-publish-gate')) {
    failures.push(
      'Unified publish gate (lib/website-publish-gate.ts) is not on HEAD / not deployed — production fulfill would not enforce ED ≥80',
    );
  }
}

// Stronger check: is gate in HEAD?
let gateOnHead = false;
try {
  execSync('git cat-file -e HEAD:lib/website-publish-gate.ts', { cwd: process.cwd() });
  gateOnHead = true;
} catch {
  gateOnHead = false;
}
if (!gateOnHead) {
  failures.push(
    'STOP: Unified publish gate is not committed to HEAD. Production cannot certify ED-gated publish until gate is deployed.',
  );
}

let verdict = 'NO-GO';
if (failures.length === 0 && stripeMode === 'test') {
  verdict = 'GO WITH CONDITIONS'; // still need to complete payment
}

const report = {
  title: 'FINAL LAUNCH CERTIFICATION',
  at: stamp,
  verdict,
  commit: commit,
  commitShort: short,
  environment: 'https://efficiencyarchitects.online',
  gitStatus: status,
  gateOnHead,
  productionEnv: {
    stripe: health?.checks?.env?.stripe,
    stripeWebhookSecret: health?.checks?.env?.stripeWebhookSecret,
    resend: health?.checks?.env?.resend,
    resendFrom: health?.checks?.env?.resendFrom,
    airtable: health?.checks?.env?.airtable,
    creativeStudio: health?.checks?.airtableSchema?.creativeStudio?.ok,
    websitePortalAuto: health?.checks?.products?.websitePortalAuto,
  },
  checkoutProbe: {
    email,
    httpStatus: checkout.status,
    stripeMode,
    sessionUrlPresent: Boolean(checkout.url),
    // do not store full live checkout URL in report to avoid accidental pay
  },
  stoppedAt: failures[0] || null,
  failures,
  note: 'Certification stopped before payment — no live charge attempted.',
};

mkdirSync('prototypes/website-director-golden-path', { recursive: true });
const out = join(
  'prototypes/website-director-golden-path',
  `final-launch-cert-${stamp.replace(/[:.]/g, '-')}.json`,
);
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ verdict, failures, stripeMode, gateOnHead, commit: short, out }, null, 2));
process.exit(2);
