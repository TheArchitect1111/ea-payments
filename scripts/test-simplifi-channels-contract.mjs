#!/usr/bin/env node
/**
 * Contract: Step 6 Channels — extension, PWA share, mobile, Amplifi feed one capture→Brief→Orb loop.
 * Run: node scripts/test-simplifi-channels-contract.mjs
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

function read(rel) {
  const path = join(root, rel);
  assert(existsSync(path), `missing ${rel}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const share = read('lib/simplifi/share-intake.ts');
assert(share.includes('parseShareTargetParams'), 'share intake helper required');
assert(share.includes('title'), 'share intake must handle title');
assert(share.includes('text'), 'share intake must handle text');
assert(share.includes('url'), 'share intake must handle url');

const manifest = read('public/manifest-simplifi.json');
assert(manifest.includes('"share_target"'), 'PWA share_target required');
assert(manifest.includes('/simplifi/capture'), 'share_target must open Simplifi capture');
assert(manifest.includes('"title"'), 'share_target title param required');
assert(manifest.includes('"text"'), 'share_target text param required');

const capturePage = read('app/simplifi/capture/page.tsx');
assert(capturePage.includes('parseShareTargetParams'), 'capture page must parse share params');
assert(capturePage.includes('initialNotes'), 'capture page must pass notes');
assert(capturePage.includes('text?:'), 'capture page must accept text searchParam');
assert(capturePage.includes('title?:'), 'capture page must accept title searchParam');

const captureApp = read('app/simplifi/capture/SimplifiCaptureApp.tsx');
assert(captureApp.includes('initialNotes'), 'capture app must seed notes');
assert(captureApp.includes('hasShareSeed'), 'capture app must detect share seeds');
assert(captureApp.includes('sc-share-seed') || captureApp.includes('Shared capture'), 'signed-out share seed UI required');
assert(captureApp.includes('notes.trim()'), 'capture app must allow notes-only capture');

const analyze = read('app/api/portal/captures/analyze/route.ts');
assert(analyze.includes('shared-note.txt'), 'analyze must accept notes-only captures');
assert(analyze.includes('submitCapture'), 'analyze must use submitCapture');

const ingest = read('app/api/capture/ingest/route.ts');
assert(ingest.includes('submitCapture'), 'extension ingest must use submitCapture');

const routes = read('lib/orb-os/routes.ts');
assert(routes.includes('text='), 'Orb capture draft must seed ?text= for non-URL notes');

const extensionBg = read('extension/background.js');
assert(extensionBg.includes('/api/capture/ingest') || extensionBg.includes('capture/ingest'), 'extension must hit ingest');
assert(extensionBg.includes('SIMPLIFI_DAILY_BRIEF'), 'extension daily brief handler required');
assert(extensionBg.includes('getBrief'), 'extension daily brief must prefer server Brief');

const mobileHome = read('mobile/app/(app)/_layout.tsx');
assert(mobileHome.includes('Brief') || mobileHome.includes('home'), 'mobile Brief tab required');
assert(mobileHome.includes('Capture') || mobileHome.includes('capture'), 'mobile Capture tab required');

const mobileCapture = read('mobile/app/(app)/capture.tsx');
assert(
  mobileCapture.includes('analyzeUrl') || mobileCapture.includes('analyzeCaptureFile'),
  'mobile capture screen must call analyze helpers',
);
const mobileClient = read('mobile/src/api/client.ts');
assert(
  mobileClient.includes('/api/portal/captures/analyze'),
  'mobile client must use portal analyze API',
);

const docs = read('docs/SIMPLIFI-ORB-SYSTEM.md');
assert(docs.includes('Step 6') || docs.includes('Channels'), 'Orb system doc must cover Step 6 channels');
assert(docs.includes('/api/capture/ingest'), 'docs must list extension ingest door');
assert(docs.includes('/api/portal/captures/analyze'), 'docs must list portal analyze door');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-channels-contract');
