#!/usr/bin/env node
/**
 * Simplifi Goal B Pass 3 — Magnifi print pack + thin URL signal quality.
 * Run: node scripts/test-simplifi-goal-b-pass3.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const printLib = join(root, 'lib/magnifi-print-pack.ts');
const printRoute = join(root, 'app/api/portal/captures/[id]/print/route.ts');
const signal = join(root, 'lib/capture-signal-quality.ts');
const pipeline = join(root, 'lib/capture-pipeline.ts');
const narrative = join(root, 'lib/opportunity-experience.ts');
const classic = join(root, 'app/magnifi/[id]/MagnifiClassicReport.tsx');
const cinematic = join(root, 'app/magnifi/[id]/MagnifiExperienceV2.tsx');
const opsDoc = join(root, 'docs/SIMPLIFI-GOAL-B-OPERATOR.md');

for (const [p, label] of [
  [printLib, 'magnifi-print-pack'],
  [printRoute, 'print route'],
  [signal, 'capture-signal-quality'],
  [opsDoc, 'operator checklist'],
]) {
  assert(existsSync(p), `missing ${label}`);
}

const printSrc = readFileSync(printLib, 'utf8');
assert(printSrc.includes('buildMagnifiPrintPackHtml'), 'print HTML builder required');
assert(printSrc.includes('autoprint'), 'autoprint script required');
assert(printSrc.includes('@media print'), 'print CSS required');

const routeSrc = readFileSync(printRoute, 'utf8');
assert(routeSrc.includes("realm: 'simplifi'"), 'print route must use simplifi portal guard');
assert(routeSrc.includes('buildMagnifiPrintPackHtml'), 'print route must build HTML');
assert(routeSrc.includes('portalSlug'), 'print route must scope by portal');

const signalSrc = readFileSync(signal, 'utf8');
assert(signalSrc.includes('THIN_CONTENT_WORD_THRESHOLD'), 'thin threshold required');
assert(signalSrc.includes('mergeAuditIntoAnalysis'), 'audit merge required');
assert(signalSrc.includes('applyThinContentTrustPenalty'), 'trust penalty required');

const pipeSrc = readFileSync(pipeline, 'utf8');
assert(pipeSrc.includes('runWebsiteAudit'), 'pipeline must call website audit on thin URLs');
assert(pipeSrc.includes('thinContentUserNote'), 'pipeline must surface thin-content note');
assert(pipeSrc.includes('lowSignal'), 'pipeline must pass lowSignal to opportunity payload');

const narrSrc = readFileSync(narrative, 'utf8');
assert(narrSrc.includes('lowSignal'), 'narrative must support low-signal copy');

const classicSrc = readFileSync(classic, 'utf8');
assert(classicSrc.includes('/print?autoprint=1'), 'classic report needs Download PDF link');

const cineSrc = readFileSync(cinematic, 'utf8');
assert(cineSrc.includes('/print?autoprint=1'), 'cinematic Magnifi needs Download PDF link');

const opsSrc = readFileSync(opsDoc, 'utf8');
assert(opsSrc.includes('Pass 3'), 'operator doc must cover Pass 3');

if (failures.length) {
  console.error('simplifi goal-b pass3: FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('simplifi goal-b pass3: PASS');
