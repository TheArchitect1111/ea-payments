#!/usr/bin/env node
/**
 * Simplifi OS Certification Harness v1.0
 *
 * Permanent release gate for the Personal Opportunity Operating System.
 * Every run writes a versioned report under prototypes/simplifi-os-cert/.
 *
 * Usage:
 *   node scripts/run-simplifi-os-certification.mjs
 *   npm run cert:simplifi-os
 *   npm run cert:simplifi-os:gate
 *
 * Shadow-safe by default: does not enable feature flags or call production APIs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectCertMetadata } from './lib/simplifi-os-cert/meta.mjs';
import {
  detectRegression,
  loadCertHistory,
  persistCertReport,
} from './lib/simplifi-os-cert/history.mjs';
import { scoreOverall } from './lib/simplifi-os-cert/score.mjs';
import { runFunctionalSuite, runSecuritySuite } from './lib/simplifi-os-cert/suites-functional-security.mjs';
import {
  runIntelligenceQualitySuite,
  runPerformanceSuite,
  runReliabilitySuite,
} from './lib/simplifi-os-cert/suites-perf-reliability-iq.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const certRoot = join(root, 'prototypes', 'simplifi-os-cert');
const gateMode = process.argv.includes('--gate') || process.env.SIMPLIFI_OS_CERT_GATE === '1';

function printCheck(c) {
  const mark =
    c.status === 'PASS' ? '✓' : c.status === 'WARNING' ? '!' : c.status === 'SKIP' ? '○' : '✗';
  const lat = c.latencyMs != null ? ` (${c.latencyMs}ms)` : '';
  console.log(
    `${mark} [${c.status}] ${c.subsystem}/${c.id} — ${c.title}${lat}\n    ${c.evidence.slice(0, 220)}`,
  );
}

function main() {
  console.log('\n══ Simplifi OS Certification Harness v1.0 ══\n');
  const metadata = collectCertMetadata(root);
  console.log(
    `git=${metadata.git.short} dirty=${metadata.git.dirty} build=${metadata.build.name}@${metadata.build.version}`,
  );
  console.log(`migration=${metadata.database.migrationVersion}`);
  console.log(`shadowMode=${metadata.shadowMode} flags=${JSON.stringify(metadata.featureFlags)}`);
  console.log('');

  const checks = [
    ...runFunctionalSuite(root),
    ...runSecuritySuite(root),
    ...runPerformanceSuite(root),
    ...runReliabilitySuite(root),
    ...runIntelligenceQualitySuite(root),
  ];

  for (const c of checks) printCheck(c);

  const scores = scoreOverall(checks);
  const draft = {
    metadata,
    scores,
    checks,
    recommendation:
      scores.classification === 'CERTIFIED'
        ? 'READY FOR INTERNAL ACTIVATION (after dogfood flag enablement)'
        : scores.classification === 'CERTIFIED WITH WARNINGS'
          ? 'REMAIN IN SHADOW MODE — address warnings before broader activation'
          : 'REMAIN IN SHADOW MODE — blocking failures',
  };

  const { historyPath, latestPath, fileName } = persistCertReport(certRoot, draft);
  const history = loadCertHistory(certRoot, 25);
  const regression = detectRegression(history, scores.overall);
  const report = { ...draft, regression, historyFile: fileName };
  writeFileSync(latestPath, JSON.stringify(report, null, 2));
  writeFileSync(historyPath, JSON.stringify(report, null, 2));

  console.log('\n── Scores ──');
  for (const [name, sub] of Object.entries(scores.bySubsystem)) {
    console.log(
      `  ${name.padEnd(14)} ${String(sub.pct).padStart(5)}%  (pass=${sub.pass} warn=${sub.warning} fail=${sub.fail} skip=${sub.skip})`,
    );
  }
  console.log(`  overall        ${scores.overall}%`);
  console.log(`  classification ${scores.classification}`);
  if (regression.previous) {
    console.log(
      `  regression     delta=${regression.delta} vs ${regression.previous.git} (${regression.previous.overall}%) ${regression.hasRegression ? 'REGRESSION' : 'ok'}`,
    );
  } else {
    console.log('  regression     baseline (first/sole history entry)');
  }
  console.log(`\nReport: ${latestPath}`);
  console.log(`History: ${historyPath}\n`);

  // Touch read to satisfy lint of unused in some bundlers
  void readFileSync;

  const ok =
    scores.classification === 'CERTIFIED' ||
    scores.classification === 'CERTIFIED WITH WARNINGS';

  if (gateMode && !ok) {
    console.error('GATE FAIL — NOT CERTIFIED');
    process.exit(1);
  }
  if (gateMode && regression.hasRegression) {
    console.error('GATE FAIL — score regression ≥ 5 points vs prior cert');
    process.exit(1);
  }

  process.exit(0);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
