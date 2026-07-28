#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fetchLaunchHealthDiagnostic, loadDotEnvLocal } from './lib/admin-bearer.mjs';

const stamp = new Date().toISOString();
const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const env = loadDotEnvLocal();

const health = (await fetchLaunchHealthDiagnostic('https://efficiencyarchitects.online', env)).body;
const checkout = await fetch('https://efficiencyarchitects.online/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    packageId: 'website_portal_starter',
    email: `cert.status.${Date.now()}@mailinator.com`,
    name: 'Cert Status',
    organization: 'Cert Status Org',
  }),
}).then(async (r) => ({ status: r.status, ...(await r.json()) }));

const stripeMode = String(checkout.url || '').includes('cs_live_')
  ? 'live'
  : String(checkout.url || '').includes('cs_test_')
    ? 'test'
    : 'unknown';

const report = {
  title: 'Post-deploy launch certification status',
  at: stamp,
  verdict: 'NO-GO',
  reason:
    'Unified publish gate deployed to production, but Stripe checkout is LIVE (cs_live). Stopped before payment per no-auto-live-charge policy. Commercial certification incomplete.',
  deployedCommitSha: '3420e5b21b8a53542e27106592e242b216abbea3',
  localHead: commit,
  deploymentUrl: 'https://efficiencyarchitects.online',
  pr: 'https://github.com/TheArchitect1111/ea-payments/pull/204',
  environment: {
    stripe: health?.checks?.env?.stripe,
    stripeWebhookSecret: health?.checks?.env?.stripeWebhookSecret,
    resend: health?.checks?.env?.resend,
    websitePortalAuto: health?.checks?.products?.websitePortalAuto,
    launchStatus: health?.status,
    stripeCheckoutMode: stripeMode,
  },
  nextAction:
    'Authorize (A) Stripe TEST-mode cert environment, or (B) one explicit live $2,497 Website + Portal Starter payment.',
};

mkdirSync('prototypes/website-director-golden-path', { recursive: true });
const out = join(
  'prototypes/website-director-golden-path',
  `post-deploy-cert-${stamp.replace(/[:.]/g, '-')}.json`,
);
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ verdict: report.verdict, deployedCommitSha: report.deployedCommitSha, stripeMode, out, nextAction: report.nextAction }, null, 2));
process.exit(2);
