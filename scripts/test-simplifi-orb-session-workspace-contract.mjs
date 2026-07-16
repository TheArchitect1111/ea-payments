#!/usr/bin/env node
/**
 * Contract: Orb session workspaces (temporary in-place surfaces over the Brief).
 * Run: node scripts/test-simplifi-orb-session-workspace-contract.mjs
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

const routes = readFileSync(join(root, 'lib/orb-os/routes.ts'), 'utf8');
assert(routes.includes('ORB_SESSION_SURFACES'), 'ORB_SESSION_SURFACES required');
assert(routes.includes('isOrbSessionSurface'), 'isOrbSessionSurface required');
for (const surface of ['inbox', 'followups', 'calendar', 'capture']) {
  assert(
    new RegExp(`ORB_SESSION_SURFACES[\\s\\S]*?'${surface}'`).test(routes),
    `${surface} must be a session surface`,
  );
}

const index = readFileSync(join(root, 'lib/orb-os/index.ts'), 'utf8');
assert(index.includes('isOrbSessionSurface'), 'orb-os index must export isOrbSessionSurface');

const sessionPath = join(root, 'app/simplifi/components/session/SessionWorkspace.tsx');
assert(existsSync(sessionPath), 'missing SessionWorkspace.tsx');
const session = existsSync(sessionPath) ? readFileSync(sessionPath, 'utf8') : '';
assert(session.includes("kind: 'inbox'"), 'session must support inbox view');
assert(session.includes("kind: 'opportunity'"), 'session must support opportunity quick view');
assert(session.includes("kind: 'followups'"), 'session must support follow-ups view');
assert(session.includes("kind: 'calendar'"), 'session must support calendar view');
assert(session.includes("kind: 'capture'"), 'session must support capture view');
assert(session.includes('buildExpirationAlerts'), 'follow-ups view must reuse buildExpirationAlerts');
assert(session.includes('analyzeCaptureUrl'), 'capture view must reuse capture client');
assert(session.includes("'/api/portal/captures/analyze'"), 'capture view must post to analyze API');
assert(session.includes('OpportunityActions'), 'opportunity view must reuse OpportunityActions');
assert(session.includes("role=\"dialog\""), 'session workspace must be a dialog');
assert(session.includes("aria-modal=\"true\""), 'session workspace must be modal');
assert(session.includes("e.key === 'Escape'"), 'Escape must dismiss the session');
assert(session.includes("document.body.style.overflow = 'hidden'"), 'background scroll must lock');
assert(session.includes('previousFocus?.focus()'), 'focus must be restored on close');
assert(session.includes('onClose'), 'session must expose dismiss handler');

const cssPath = join(root, 'app/simplifi/components/session/session-workspace.css');
assert(existsSync(cssPath), 'missing session-workspace.css');

const globalOrb = readFileSync(join(root, 'app/simplifi/components/GlobalOrb.tsx'), 'utf8');
assert(globalOrb.includes('SessionWorkspace'), 'GlobalOrb must render SessionWorkspace');
assert(globalOrb.includes('isOrbSessionSurface'), 'GlobalOrb must branch on session surfaces');
assert(globalOrb.includes('setSessionView'), 'GlobalOrb must manage session state');
assert(globalOrb.includes('sessionViewForSurface'), 'GlobalOrb must map surfaces to session views');
assert(
  globalOrb.includes("{ kind: 'opportunity', id: soleMatch.id }"),
  'sole search match must open an opportunity quick view',
);

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-orb-session-workspace-contract');
