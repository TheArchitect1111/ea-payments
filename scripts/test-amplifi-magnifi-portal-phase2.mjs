/**
 * Phase 2 — Magnifi reliability contracts for portal-ready Amplifi/Magnifi.
 * Run: node scripts/test-amplifi-magnifi-portal-phase2.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function read(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) throw new Error(`Missing ${rel}`);
  return readFileSync(p, 'utf8');
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`PASS: ${msg}`);
  }
}

const response = read('lib/capture-response.ts');
const analyze = read('app/api/portal/captures/analyze/route.ts');
const magnifiPage = read('app/magnifi/[id]/page.tsx');
const amplifiUi = read('app/portal/[slug]/amplifi/AmplifiPortalExperience.tsx');
const objects = read('lib/simplifi-objects.ts');
const workspace = read('app/simplifi/workspace/SimplifiWorkspace.tsx');
const templates = read('lib/ea-template-registry.ts');

assert(response.includes('sanitizeCaptureClientError'), 'capture-response exports client-safe error sanitizer');
assert(response.includes('airtable'), 'sanitizer recognizes Airtable internals');
assert(
  response.includes("magnifiUrl: result.record ? `/magnifi/${result.record.id}`"),
  'successful capture response always sets relative Magnifi URL',
);
assert(analyze.includes('sanitizeCaptureClientError'), 'portal analyze uses client-safe persist errors');

assert(magnifiPage.includes('Story unavailable'), 'Magnifi missing capture shows calm unavailable');
assert(!magnifiPage.includes('notFound()'), 'Magnifi page does not use raw notFound for missing');
assert(magnifiPage.includes('/simplifi/workspace'), 'unavailable page links to Simplifi workspace');
assert(magnifiPage.includes('/simplifi/capture'), 'unavailable page links to capture');

assert(
  amplifiUi.includes('Capture once to create your first story'),
  'Amplifi hub empty state invites first capture',
);
assert(amplifiUi.includes('Open latest Magnifi story') || amplifiUi.includes('magnifiUrl'), 'Amplifi surfaces Magnifi when present');

assert(
  objects.includes("const magnifiUrl = `/magnifi/${capture.id}`"),
  'workspace objects always set relative Magnifi URL',
);
assert(
  workspace.includes('obj.magnifiUrl') && workspace.includes('Magnifi'),
  'Simplifi workspace Magnifi button uses magnifiUrl',
);
assert(!workspace.includes('{obj.considerUrl && ('), 'workspace Magnifi no longer gated on considerUrl only');

assert(templates.includes("'executive-transformation'"), 'executive-transformation template present');
assert(templates.includes("'entrepreneur-launch'"), 'entrepreneur-launch template present');
assert(templates.includes("'hidden-asset-discovery'"), 'hidden-asset-discovery template present');
assert(templates.includes('cinematicHook:'), 'templates define cinematic hooks');
assert(templates.includes('twelveMonths:'), 'templates define twelve-month copy');

process.exit(failed ? 1 : 0);
