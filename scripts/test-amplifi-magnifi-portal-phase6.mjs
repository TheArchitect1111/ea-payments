/**
 * Phase 6 — Amplifi/Magnifi ops & support gate contracts.
 * Run: node scripts/test-amplifi-magnifi-portal-phase6.mjs
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

const health = read('lib/amplifi-magnifi-health.ts');
const ops = read('lib/platform-ops.ts');
const launch = read('lib/launch-health.ts');
const pass1 = read('lib/simplifi-pass1-ops.ts');
const validate = read('scripts/validate-simplifi-launch-readiness.mjs');
const sop = read('docs/PRODUCT-SUPPORT-AND-TRIAGE-SOP.md');
const buildDoc = read('docs/AMPLIFI-MAGNIFI-PORTAL-READY-BUILD.md');

assert(health.includes('probeAmplifiMagnifiPortalReady'), 'amplifi-magnifi health probe exported');
assert(health.includes('amplifiUnauth'), 'probe covers Amplifi unauth gate');
assert(health.includes('amplifiAuthed'), 'probe covers Amplifi authed hub');
assert(health.includes('magnifiSample'), 'probe covers Magnifi sample');
assert(health.includes('Story unavailable'), 'probe expects calm Magnifi unavailable');

assert(ops.includes('probeAmplifiMagnifiPortalReady'), 'platform-ops runs Amplifi/Magnifi probe');
assert(ops.includes('amplifiMagnifiSubsystem'), 'platform-ops surfaces Amplifi/Magnifi subsystem');
assert(ops.includes('/magnifi/__ea_ops_probe_missing__'), 'critical routes include Magnifi unavailable probe path');

assert(launch.includes('amplifiMagnifiPortalReady'), 'launch health exposes portal-ready probe flag');
assert(launch.includes('amplifiMagnifiProbe'), 'launch health includes probe detail');

assert(pass1.includes('/magnifi/{id}'), 'uptime guidance mentions Magnifi monitor');
assert(pass1.includes('/portal/{slug}/amplifi'), 'uptime guidance mentions Amplifi monitor');

assert(validate.includes('magnifi-unavailable-calm'), 'launch readiness checks Magnifi unavailable');
assert(validate.includes('amplifi-unauth-login-gate'), 'launch readiness checks Amplifi login gate');
assert(validate.includes('amplifi-hub-authed'), 'launch readiness checks authed Amplifi hub');

assert(sop.includes('Empty Amplifi Hub SOP'), 'SOP documents empty Amplifi triage');
assert(sop.includes('Amplifi Entitlement Missing SOP'), 'SOP documents entitlement missing triage');
assert(sop.includes('Missing Magnifi Link SOP'), 'SOP keeps Magnifi missing triage');
assert(sop.includes('Story retired'), 'SOP documents archive retire path');

assert(buildDoc.includes('Phase 6'), 'build sequence includes Phase 6');

process.exit(failed ? 1 : 0);
