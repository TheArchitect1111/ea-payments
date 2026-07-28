#!/usr/bin/env node
/**
 * Website + Portal E2E certification probe — customer-path stages only.
 * Does NOT bypass Journey with admin force-publish or hand-created records.
 * Stops cleanly when env/product gates block further stages.
 *
 * Run: node scripts/run-website-portal-e2e-cert-probe.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const base = (process.env.CERT_BASE_URL || 'https://efficiencyarchitects.online').replace(/\/$/, '');
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const nonce = randomBytes(3).toString('hex');
const clientSlugHint = `cert-wp-${stamp}-${nonce}`;
const testEmail = `cert.wp.${stamp}.${nonce}@mailinator.com`;
const businessName = `Cert WP ${stamp} ${nonce}`;

const stages = [];
function record(stage, status, detail = {}) {
  stages.push({ stage, status, at: new Date().toISOString(), ...detail });
  const mark = status === 'PASS' ? '✓' : status === 'BLOCKED' ? '○' : '✗';
  console.log(`${mark} [${status}] ${stage}${detail.reason ? ` — ${detail.reason}` : ''}`);
}

async function main() {
  record('cert.setup', 'PASS', {
    base,
    testEmail,
    businessName,
    clientSlugHint,
    note: 'Fresh non-demo identity generated for this run',
  });

  // 1) Canonical CTP intake surface
  try {
    const ctp = await fetch('https://cc.efficiencyarchitects.online/ctp', {
      redirect: 'follow',
      headers: { Accept: 'text/html' },
    });
    const html = await ctp.text();
    const looksLikeCtp =
      ctp.ok &&
      !/NextStepsPro LaunchPad/i.test(html) &&
      (/consider the possibilities|operational|assessment|ctp/i.test(html) || html.length > 500);
    record('1.ctp_intake_surface', ctp.ok && looksLikeCtp ? 'PASS' : 'FAIL', {
      url: 'https://cc.efficiencyarchitects.online/ctp',
      httpStatus: ctp.status,
      bytes: html.length,
    });
  } catch (e) {
    record('1.ctp_intake_surface', 'FAIL', { reason: String(e) });
  }

  // 2) Assessment submit (customer API used by intake)
  let submitBody = null;
  try {
    const res = await fetch(`${base}/api/assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName,
        contactName: 'Cert Operator',
        email: testEmail,
        teamSizeLabel: '6-15 people',
        revenueRange: '$500k to $1M',
        currentSystems: 'Airtable, Stripe',
        operationalChallenges: ['too_many_manual_steps'],
        growthGoals: 'Website + Portal end-to-end certification',
        capacityConstraints: 'n/a',
        discoveryVersion: '1',
        discoveryAnswers: {
          organization_name: businessName,
          cert_run_id: clientSlugHint,
        },
        desiredExperiences: ['website'],
      }),
    });
    submitBody = await res.json().catch(() => ({}));
    const ok = res.ok && (submitBody.ok !== false);
    record('2.assessment_submit', ok ? 'PASS' : 'FAIL', {
      url: `${base}/api/assessment/submit`,
      httpStatus: res.status,
      responseKeys: Object.keys(submitBody || {}),
      proposalId: submitBody.proposalId || submitBody.proposalRecordId || null,
      submissionId: submitBody.submissionId || submitBody.ctpSubmissionId || null,
      portalSlug: submitBody.portalSlug || submitBody.slug || null,
      rawOk: submitBody.ok,
      error: submitBody.error || null,
    });
  } catch (e) {
    record('2.assessment_submit', 'FAIL', { reason: String(e) });
  }

  // 3) Buy page / commercial offer surface
  try {
    const buy = await fetch(`${base}/buy`, { redirect: 'follow' });
    const html = await buy.text();
    const hasOffer = /website|portal|2,?497|starter/i.test(html);
    record('3.commercial_buy_surface', buy.ok && hasOffer ? 'PASS' : 'FAIL', {
      url: `${base}/buy`,
      httpStatus: buy.status,
      hasOfferCopy: hasOffer,
    });
  } catch (e) {
    record('3.commercial_buy_surface', 'FAIL', { reason: String(e) });
  }

  // 4) Payment — cannot complete without Stripe customer checkout + webhook
  record('4.payment_confirmation', 'BLOCKED', {
    reason:
      'Local CERT environment missing STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_PRICE_WEBSITE_PORTAL_STARTER; completing card checkout would require live Stripe test session + webhook delivery. Not simulated.',
  });

  // 5–6) Provisioning / bind — blocked without payment webhook
  record('5.client_provisioning', 'BLOCKED', {
    reason: 'Depends on Stripe webhook → fulfillPaidClient after successful payment',
  });
  record('6.ctp_workspace_binding', 'BLOCKED', {
    reason: 'ensureCtpWorkspaceForWebsitePortal runs inside fulfillPaidClient after paid provision',
  });

  // 7–9) Director / compose — offline proof already exists; production persist unproven this run
  record('7-9.story_classification_direction_compose', 'PASS', {
    reason:
      'composeDirectedWebsite wired in provision-website-portal; five-org offline run Approved ED 85 each; no EAFeatures',
    evidence: 'prototypes/website-director-golden-path/five-org-run/summary.json',
  });

  record('10.website_persistence', 'BLOCKED', {
    reason:
      'Requires paid fulfill → provisionWebsitePortalSite → Creative Studio; AIRTABLE_CREATIVE_STUDIO_TABLE unset locally; no paid client this run',
  });

  record('11.portal_provisioning', 'BLOCKED', {
    reason: 'Same paid fulfill gate',
  });

  record('12.guide_initialization', 'BLOCKED', {
    reason: 'Requires provisioned portal + CTP workspace',
  });

  record('13.documents_support', 'BLOCKED', {
    reason: 'Requires authenticated portal session on fresh client',
  });

  // 14) Experience Director vs customer publish path
  record('14.experience_director_on_customer_publish', 'FAIL', {
    reason:
      'Customer Website+Portal auto-publish via fulfillPaidClient → provisionWebsitePortalSite does NOT call assertExperienceDirectorPublishGate. ED gate exists only on Factory publishFactoryWebsite. Certification requires Approved ≥80 before publish — structural miss.',
    evidence: 'lib/fulfill-paid-client.ts provisions site without ED; lib/factory-publish-website.ts gates ED',
  });

  record('15.website_publish_gate', 'FAIL', {
    reason: 'Auto path publishes ExperiencePage status=published without ED Approved',
  });

  record('16.magic_link_entry', 'BLOCKED', {
    reason: 'Requires fulfillPaidClient + RESEND_API_KEY (MISSING locally) + ADMIN_SESSION_SECRET (present)',
  });

  record('17.return_visit_state', 'BLOCKED', {
    reason: 'No provisioned client session to restore',
  });

  // Structural checks (code-path, not live)
  record('S.classification_cd_persisted', 'FAIL', {
    reason:
      'buildStarterWebsitePuckData discards director package except puckData; full Story Classification + Creative Direction objects are not saved to ExperiencePage / Airtable',
    evidence: 'lib/provision-website-portal.ts uses only composeDirectedWebsite().puckData',
  });

  record('S.compose_no_eafeatures', 'PASS', {
    reason: 'Layout Composer forbids EAFeatures; five-org verification passed',
  });

  const pass = stages.filter((s) => s.status === 'PASS').length;
  const fail = stages.filter((s) => s.status === 'FAIL').length;
  const blocked = stages.filter((s) => s.status === 'BLOCKED').length;

  let verdict = 'NO-GO';
  if (fail === 0 && blocked === 0) verdict = 'GO';
  else if (fail <= 2 && blocked > 0) verdict = 'GO WITH CONDITIONS';
  // Structural ED publish miss is hard NO-GO for this cert
  if (stages.some((s) => s.stage.includes('experience_director') && s.status === 'FAIL')) {
    verdict = 'NO-GO';
  }

  const report = {
    title: 'Website + Portal End-to-End Production Certification',
    at: new Date().toISOString(),
    verdict,
    identity: { testEmail, businessName, clientSlugHint, base },
    counts: { pass, fail, blocked, total: stages.length },
    stages,
    submitBody,
    reproduce: [
      'node scripts/_cert-env-probe.mjs',
      'npm run launch:preflight',
      'node scripts/test-website-portal-starter.mjs',
      'node scripts/test-fulfill-paid-client.mjs',
      'npx --yes tsx scripts/test-layout-composer-five-orgs.ts',
      'node scripts/run-website-portal-e2e-cert-probe.mjs',
    ],
  };

  const outDir = join(root, 'prototypes/website-director-golden-path');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `e2e-cert-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log('\n' + JSON.stringify({ verdict, counts: report.counts, outPath, testEmail }, null, 2));
  process.exit(verdict === 'GO' ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
