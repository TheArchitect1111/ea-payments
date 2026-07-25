/**
 * Phase 4 — Magnifi public-by-link share & access policy contracts.
 * Run: node scripts/test-amplifi-magnifi-portal-phase4.mjs
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

const policy = read('lib/amplifi-share-policy.ts');
const hubUi = read('app/portal/[slug]/amplifi/AmplifiPortalExperience.tsx');
const portalLib = read('lib/amplifi-portal.ts');
const magnifiPage = read('app/magnifi/[id]/page.tsx');
const magnifiV2 = read('app/magnifi/[id]/MagnifiExperienceV2.tsx');
const email = read('lib/email.ts');
const success = read('app/components/CaptureSuccessPanel.tsx');
const successFlow = read('lib/capture-success-flow.ts');
const postApp = read('app/amplifi/AmplifiPostApp.tsx');
const capturesApi = read('app/api/portal/captures/route.ts');
const storyApi = read('app/api/portal/captures/[id]/story/route.ts');
const sop = read('docs/PRODUCT-SUPPORT-AND-TRIAGE-SOP.md');
const buildDoc = read('docs/AMPLIFI-MAGNIFI-PORTAL-READY-BUILD.md');

assert(policy.includes("MAGNIFI_PUBLIC_LINK_WARNING = 'Anyone with the link can view this story.'"), 'canonical public-link warning');
assert(policy.includes('preferPortalMagnifiUrl'), 'preferPortalMagnifiUrl helper exists');
assert(policy.includes('isMagnifiCaptureRetired'), 'retired/archived helper exists');
assert(policy.includes('absoluteAmplifiShareUrl'), 'absolute share URL helper exists');

assert(hubUi.includes('Anyone with the link can view this story.'), 'Amplifi hub warns public-by-link');
assert(portalLib.includes('Anyone with the link can view this story.'), 'hub disclaimer includes public-link warning');
assert(magnifiV2.includes('publicLinkWarning'), 'Magnifi experience accepts public-link warning');
assert(magnifiPage.includes('MAGNIFI_PUBLIC_LINK_WARNING'), 'Magnifi page passes public-link warning');
assert(magnifiPage.includes('isMagnifiCaptureRetired'), 'Magnifi retires archived captures');
assert(magnifiPage.includes('Story retired'), 'archived Magnifi shows retired copy');
assert(email.includes('Anyone with the link can view this story.'), 'capture-ready email warns public-by-link');
assert(email.includes("ctaLabel: 'Open Magnifi'"), 'capture-ready email CTA prefers Magnifi');
assert(email.includes('ctaUrl: data.magnifiUrl'), 'capture-ready email CTA uses magnifiUrl');

assert(success.includes('preferPortalMagnifiUrl'), 'capture success prefers Magnifi for share');
assert(success.includes('MAGNIFI_PUBLIC_LINK_WARNING'), 'capture success shows public-link warning');
assert(successFlow.includes('Share the Magnifi link'), 'pipeline step prefers Magnifi share language');
assert(!successFlow.includes('Share the Consider link with anyone'), 'pipeline no longer defaults to Consider-first share');

assert(postApp.includes('preferPortalMagnifiUrl'), 'Amplifi draft tool prefers Magnifi URL');
assert(postApp.includes('MAGNIFI_PUBLIC_LINK_WARNING'), 'Amplifi draft tool warns public-by-link');

assert(capturesApi.includes("magnifiUrl: `/magnifi/${c.id}`"), 'portal captures API returns real Magnifi URLs');
assert(!capturesApi.includes('considerSlug ? `/consider/'), 'portal captures API no longer maps magnifiUrl to Consider');
assert(capturesApi.includes("status !== 'Archived'"), 'portal captures list hides archived');
assert(storyApi.includes('preferPortalMagnifiUrl'), 'story draft API prefers Magnifi URL');
assert(storyApi.includes('absoluteAmplifiShareUrl'), 'story draft API absolutizes Magnifi URL');

assert(sop.includes('Retire / Unshare Sensitive Magnifi Capture'), 'support SOP has retire/unshare section');
assert(sop.includes('Story retired'), 'SOP verifies retired Magnifi page');
assert(sop.includes('Anyone with the link can view this story.'), 'SOP documents client-facing warning');
assert(sop.includes('public-by-link'), 'SOP states V1 public-by-link policy');

assert(!buildDoc.includes('Postiz') || buildDoc.includes('No new social networks or Postiz'), 'build doc keeps Postiz out of V1');
assert(policy.includes('/magnifi/'), 'policy builds Magnifi paths — no new social networks');

process.exit(failed ? 1 : 0);
