#!/usr/bin/env node
/**
 * Live launch-blocker verification (read-only probes + local money-loop gate).
 * Evidence for Production Readiness Sprint #1.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fetchLaunchHealthDiagnostic, loadDotEnvLocal } from './lib/admin-bearer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const APEX = 'https://efficiencyarchitects.online';
const WWW = 'https://www.efficiencyarchitects.online';
const env = loadDotEnvLocal();

const LEGAL = [
  '/legal/privacy',
  '/legal/terms',
  '/legal/eula',
  '/legal/ai-disclosure',
  '/legal/support',
  '/legal/cookies',
];

async function probe(url) {
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: 'manual' });
    return {
      url,
      status: res.status,
      location: res.headers.get('location') || null,
      ms: Date.now() - started,
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (err) {
    return { url, status: 0, error: String(err), ms: Date.now() - started, ok: false };
  }
}

async function main() {
  const legalApex = [];
  for (const path of LEGAL) {
    legalApex.push(await probe(`${APEX}${path}`));
  }
  const legalWww = [];
  for (const path of ['/legal/privacy', '/api/health/launch']) {
    legalWww.push(await probe(`${WWW}${path}`));
  }

  const health = await probe(`${APEX}/api/health/launch`);
  let healthBody = null;
  try {
    healthBody = (await fetchLaunchHealthDiagnostic(APEX, env)).body;
  } catch {
    healthBody = null;
  }

  const redirects = [
    await probe(`${APEX}/privacy`),
    await probe(`${APEX}/terms`),
  ];

  const money = spawnSync('node', ['scripts/audit-commercial-env.mjs'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });

  const report = {
    at: new Date().toISOString(),
    canonicalHost: APEX,
    note: 'www is not the EA platform API host; legal must resolve on apex.',
    legalApex,
    legalApexAll200: legalApex.every((r) => r.status === 200),
    redirects,
    legalWwwFalsePositive: legalWww,
    health,
    healthStatus: healthBody?.status ?? null,
    esignatures: healthBody?.checks?.esignatures ?? healthBody?.esignatures ?? null,
    moneyLoopEnv: {
      exitCode: money.status,
      gate: money.stdout?.includes('Gate: PASS')
        ? 'PASS'
        : money.stdout?.includes('Gate: FAIL')
          ? 'FAIL'
          : 'UNKNOWN',
      tail: (money.stdout || money.stderr || '').split('\n').slice(-20).join('\n'),
    },
  };

  const outDir = join(root, 'prototypes', 'launch-blocker-sprint');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'evidence-latest.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log('\nWrote', outPath);
  process.exit(report.legalApexAll200 ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
