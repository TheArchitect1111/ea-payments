#!/usr/bin/env node
/**
 * Contract: Simplifi auth clarity (Bar A pass 3).
 * - demo-enter supports optional ?next= but defaults to CTP (canonical rule).
 * - Simplifi login explains magic-link vs portal password.
 * Run: node scripts/test-simplifi-auth-clarity-contract.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const demo = readFileSync(join(root, 'app/api/auth/demo-enter/route.ts'), 'utf8');
assert(demo.includes('safeDemoNext'), 'demo-enter must guard next param');
assert(demo.includes("'/portal/demo-client/ctp'"), 'demo-enter default must stay CTP');
assert(demo.includes('searchParams.get(\'next\')'), 'demo-enter must read ?next=');
assert(demo.includes("raw.startsWith('//')"), 'demo-enter must reject protocol-relative next');
assert(demo.includes('NextRequest'), 'demo-enter GET must accept request for query params');

const login = readFileSync(join(root, 'app/simplifi/login/SimplifiLoginClient.tsx'), 'utf8');
assert(/one-tap email link/i.test(login), 'Simplifi login must explain magic-link');
assert(login.includes('/portal/login'), 'Simplifi login must link to portal');
assert(/email code or password/i.test(login), 'Simplifi login must explain portal auth methods');

const guide = readFileSync(join(root, 'docs/SIMPLIFI-EARLY-ACCESS-TESTER-GUIDE.md'), 'utf8');
assert(
  guide.includes('/api/auth/demo-enter?next=/simplifi/workspace'),
  'tester guide must document one-click demo to Brief',
);

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-auth-clarity-contract');
