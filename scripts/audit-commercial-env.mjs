#!/usr/bin/env node
/**
 * Phase 1 — Commercial environment audit (TEST / local / production expectations).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadCommercialTestEnv,
  auditCommercialEnv,
  assertTestCommercialReady,
  ROOT,
} from './lib/commercial-test-env.mjs';

loadCommercialTestEnv();
const rows = auditCommercialEnv(process.env);
const gate = assertTestCommercialReady(process.env);

console.log('\nCommercial Environment Audit\n');
console.log(
  [
    'Variable'.padEnd(40),
    'Required'.padEnd(10),
    'Present'.padEnd(14),
    'TEST expectation',
  ].join(''),
);
console.log('-'.repeat(100));
for (const r of rows) {
  const mark = r.highlight ? '!' : ' ';
  console.log(
    `${mark}${r.variable.padEnd(39)} ${String(r.required).padEnd(10)} ${r.safe.padEnd(14)} ${r.test}`,
  );
}
console.log('\nGate:', gate.ok ? 'PASS — TEST ready' : 'FAIL — stop before checkout');
if (gate.errors.length) {
  console.log('Errors:');
  for (const e of gate.errors) console.log('  -', e);
}
if (gate.warnings.length) {
  console.log('Warnings:');
  for (const w of gate.warnings) console.log('  -', w);
}

const outDir = join(ROOT, 'prototypes', 'v1-commercial-cert');
mkdirSync(outDir, { recursive: true });
const report = {
  title: 'Commercial Environment Audit',
  at: new Date().toISOString(),
  gate,
  rows: rows.map((r) => ({
    variable: r.variable,
    purpose: r.purpose,
    required: r.required,
    present: r.present,
    status: r.safe,
    mode: r.mode,
    default: r.default,
    production: r.production,
    development: r.development,
    test: r.test,
    highlight: r.highlight,
  })),
};
writeFileSync(join(outDir, 'env-audit.json'), JSON.stringify(report, null, 2));
console.log('\nWrote prototypes/v1-commercial-cert/env-audit.json');
process.exit(gate.ok ? 0 : 2);
