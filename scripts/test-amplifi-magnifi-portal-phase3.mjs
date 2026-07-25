/**
 * Phase 3 — Amplifi portal hub polish contracts.
 * Run: node scripts/test-amplifi-magnifi-portal-phase3.mjs
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

const portalLib = read('lib/amplifi-portal.ts');
const hubUi = read('app/portal/[slug]/amplifi/AmplifiPortalExperience.tsx');
const hubPage = read('app/portal/[slug]/amplifi/page.tsx');
const hubCss = read('app/portal/[slug]/amplifi/amplifi-portal.css');
const hubLoading = read('app/portal/[slug]/amplifi/loading.tsx');
const submitApi = read('app/api/portal/amplifi/submit-for-approval/route.ts');
const postApp = read('app/amplifi/AmplifiPostApp.tsx');
const draftPanel = read('app/components/StoryDraftPanel.tsx');
const postPage = read('app/amplifi/page.tsx');

// --- Experience model ---
assert(portalLib.includes('shareDisclaimer'), 'experience includes share disclaimer');
assert(portalLib.includes('captureCount'), 'experience tracks captureCount');
assert(portalLib.includes('draftShareUrl'), 'experience builds draftShareUrl');
assert(portalLib.includes('Nothing auto-posts'), 'hub disclaimer rejects auto-posting');
assert(
  portalLib.includes('no Communications calendar') || portalLib.includes('not an auto-publish calendar'),
  'hub never implies Communications auto-publish',
);

// --- Empty / full / error ---
assert(hubUi.includes('No Magnifi stories yet'), 'empty state headline present');
assert(hubUi.includes('Capture once to create your first story'), 'empty CTA to Simplifi capture');
assert(hubUi.includes('Open latest Magnifi story'), 'full state Magnifi CTA');
assert(hubUi.includes('Review draft before posting'), 'full state draft review CTA');
assert(hubUi.includes('loadError'), 'hub supports load error state');
assert(hubUi.includes('We could not load your stories'), 'calm error copy');
assert(hubPage.includes('loadError'), 'page catches capture load failures');
assert(existsSync(join(root, 'app/portal/[slug]/amplifi/loading.tsx')), 'amplifi route loading.tsx exists');
assert(hubLoading.includes('PortalRouteSkeleton'), 'loading uses portal skeleton');

// --- Draft quality gate ---
assert(draftPanel.includes('Review before posting'), 'draft panel labeled review-before-posting');
assert(postApp.includes('Review before posting'), 'draft tool uses review-before-posting');
assert(postApp.includes('Share manually (you post)'), 'manual share is explicit (not skip-approval auto-post)');
assert(!postApp.includes('Or post now (skip approval)'), 'removed skip-approval auto-post framing');
assert(postApp.includes('does not auto-publish'), 'draft tool copy rejects auto-publish');
assert(postApp.includes('Submit for approval'), 'submit for approval CTA retained');
assert(postApp.includes('Nothing posts automatically'), 'submit success clarifies no auto-post');
assert(postPage.includes('Review before posting'), 'amplifi page metadata aligns');

// --- Submit fail-closed ---
assert(submitApi.includes('isModuleEnabled'), 'submit-for-approval checks module entitlement');
assert(submitApi.includes("moduleId: 'amplifi'"), 'submit requires amplifi module');
assert(submitApi.includes('status: 403'), 'submit fails closed with 403 when not entitled');
assert(submitApi.includes('Awaiting Approval'), 'submit still creates awaiting-approval request');

// --- Mobile ---
assert(hubCss.includes('min-height: 44px'), 'CTA touch target ≥44px');
assert(hubCss.includes('flex-direction: column'), 'mobile stacks CTA actions');
assert(hubCss.includes('max-width: 420px') || hubCss.includes('max-width: 760px'), 'phone breakpoints present');
assert(hubCss.includes('width: 100%'), 'mobile full-width buttons for reachability');

process.exit(failed ? 1 : 0);
