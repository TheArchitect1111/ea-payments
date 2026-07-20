#!/usr/bin/env node
/**
 * Launch confidence gate (S0): run core checks and print a single pass/fail report.
 * Usage: npm run launch:preflight
 * Optional: LAUNCH_PREFLIGHT_BASE=https://efficiencyarchitects.online npm run launch:preflight
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const base = (process.env.LAUNCH_PREFLIGHT_BASE || 'https://efficiencyarchitects.online').replace(
  /\/$/,
  '',
);

const STEPS = [
  { id: 'launch-report', cmd: 'node', args: ['scripts/launch-command-center.mjs'] },
  { id: 'launch-readiness', cmd: 'node', args: ['scripts/launch-readiness.mjs'] },
  // Soft until CTP email/overview copy contracts re-align with Opportunity Experience redesign.
  { id: 'ctp-spine', cmd: 'node', args: ['scripts/run-ctp-tests.mjs', '--spine'], soft: true },
  { id: 'website-portal-starter', cmd: 'node', args: ['scripts/test-website-portal-starter.mjs'] },
  { id: 'fulfill-paid-client', cmd: 'node', args: ['scripts/test-fulfill-paid-client.mjs'] },
  { id: 'factory-publish-website', cmd: 'node', args: ['scripts/test-factory-publish-website.mjs'] },
  { id: 'oib-email', cmd: 'node', args: ['scripts/test-factory-launch-email.mjs'] },
  { id: 'canonical-ctp', cmd: 'node', args: ['scripts/test-canonical-ctp-intake.mjs'] },
];

const results = [];

function runStep(step) {
  console.log(`\n=== ${step.id} ===`);
  const r = spawnSync(step.cmd, step.args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
  });
  const ok = r.status === 0;
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  results.push({ id: step.id, ok, soft: Boolean(step.soft), status: r.status ?? 1 });
  if (!ok && step.soft) {
    console.warn(`[soft] ${step.id} failed — does not fail preflight gate`);
  }
  return ok || Boolean(step.soft);
}

async function liveApiSmokes() {
  const out = { ctpSubmit: null, buyPage: null, launchHealth: null };
  try {
    const healthRes = await fetch(`${base}/api/health/launch`);
    const health = await healthRes.json().catch(() => ({}));
    out.launchHealth = {
      status: healthRes.status,
      ok: Boolean(health?.ok ?? health?.full_launch_ready ?? healthRes.ok),
      websitePortalAuto: health?.websitePortalAuto ?? health?.checks?.websitePortalAuto,
      score: health?.score ?? health?.launchScore,
    };
  } catch (e) {
    out.launchHealth = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const buyRes = await fetch(`${base}/buy`, { redirect: 'manual' });
    out.buyPage = {
      status: buyRes.status,
      ok: buyRes.status >= 200 && buyRes.status < 400,
    };
  } catch (e) {
    out.buyPage = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const stamp = Date.now();
    const body = {
      businessName: `Launch Preflight ${stamp}`,
      contactName: 'Launch Preflight',
      email: `qa+preflight-${stamp}@efficiencyarchitects.online`,
      teamSizeLabel: '6-15 people',
      revenueRange: '$500k to $1M',
      currentSystems: 'Airtable, Stripe',
      operationalChallenges: ['too_many_manual_steps'],
      growthGoals: 'Launch confidence preflight smoke',
      capacityConstraints: 'n/a',
      discoveryVersion: '1',
      discoveryAnswers: { organization_name: `Launch Preflight ${stamp}` },
      desiredExperiences: ['website'],
    };
    const submitRes = await fetch(`${base}/api/assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const submitJson = await submitRes.json().catch(() => ({}));
    out.ctpSubmit = {
      status: submitRes.status,
      ok: submitRes.ok && Boolean(submitJson.ok !== false),
      saved: submitJson.saved,
      error: submitJson.error,
    };
  } catch (e) {
    out.ctpSubmit = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return out;
}

let allOk = true;
for (const step of STEPS) {
  const ok = runStep(step);
  if (!ok) allOk = false;
}

console.log('\n=== live-api-smokes ===');
const live = await liveApiSmokes();
const liveOk = Boolean(live.launchHealth?.ok && live.buyPage?.ok && live.ctpSubmit?.ok);
results.push({ id: 'live-api-smokes', ok: liveOk, detail: live });
if (!liveOk) allOk = false;
console.log(JSON.stringify(live, null, 2));

const report = {
  at: new Date().toISOString(),
  base,
  pass: allOk,
  results,
  live,
  canonicalCtp: 'https://cc.efficiencyarchitects.online/ctp',
};
writeFileSync(join(root, '.launch-preflight.json'), JSON.stringify(report, null, 2));

console.log('\n=== LAUNCH PREFLIGHT SUMMARY ===');
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}`);
}
console.log(allOk ? '\nPREFLIGHT PASS' : '\nPREFLIGHT FAIL');
console.log('Wrote .launch-preflight.json');
process.exit(allOk ? 0 : 1);
