#!/usr/bin/env node
/**
 * Simplifi Goal B Pass 2 — upload limits, processing UX, guest claim.
 * Run: node scripts/test-simplifi-goal-b-pass2.mjs
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

const limits = join(root, 'lib/capture-upload-limits.ts');
const clientUpload = join(root, 'lib/client-image-upload.ts');
const analyze = join(root, 'app/api/portal/captures/analyze/route.ts');
const claim = join(root, 'app/api/portal/captures/claim/route.ts');
const panel = join(root, 'app/components/CaptureProcessingPanel.tsx');
const captureApp = join(root, 'app/simplifi/capture/SimplifiCaptureApp.tsx');
const polling = join(root, 'lib/capture-polling.ts');
const records = join(root, 'lib/capture-records.ts');
const opsDoc = join(root, 'docs/SIMPLIFI-GOAL-B-OPERATOR.md');

for (const [p, label] of [
  [limits, 'capture-upload-limits'],
  [claim, 'claim route'],
  [opsDoc, 'operator checklist'],
]) {
  assert(existsSync(p), `missing ${label}`);
}

const limitsSrc = readFileSync(limits, 'utf8');
assert(limitsSrc.includes('MAX_CAPTURE_UPLOAD_BYTES'), 'shared upload max required');
assert(limitsSrc.includes('rememberGuestCaptureId'), 'guest capture stash required');
assert(limitsSrc.includes('stashProcessingCaptureId'), 'processing resume stash required');

const clientSrc = readFileSync(clientUpload, 'utf8');
assert(clientSrc.includes('MAX_CAPTURE_UPLOAD_BYTES'), 'client must use shared limit');
assert(clientSrc.includes('HEIC'), 'HEIC guard required');

const analyzeSrc = readFileSync(analyze, 'utf8');
assert(analyzeSrc.includes('MAX_CAPTURE_UPLOAD_BYTES'), 'server must enforce upload limit');
assert(analyzeSrc.includes('413'), 'oversized uploads should return 413');

const claimSrc = readFileSync(claim, 'utf8');
assert(claimSrc.includes('updateCapturePortalSlug'), 'claim must reassign portal slug');
assert(claimSrc.includes('demo-client'), 'claim must only move guest captures');

const panelSrc = readFileSync(panel, 'utf8');
assert(panelSrc.includes('Open workspace') || panelSrc.includes('workspaceHref'), 'timeout UX needs workspace CTA');

const appSrc = readFileSync(captureApp, 'utf8');
assert(appSrc.includes('rememberGuestCaptureId'), 'capture app must stash guest ids');
assert(appSrc.includes('/api/portal/captures/claim'), 'capture app must claim on login');
assert(appSrc.includes('sc-guest-banner') || appSrc.includes('guest'), 'guest sign-in banner required');

const pollSrc = readFileSync(polling, 'utf8');
assert(pollSrc.includes('workspace'), 'timeout message should point to workspace');

const recordsSrc = readFileSync(records, 'utf8');
assert(recordsSrc.includes('updateCapturePortalSlug'), 'capture-records must support slug update');

if (failures.length) {
  console.error('simplifi goal-b pass2: FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('simplifi goal-b pass2: PASS');
