#!/usr/bin/env node
/**
 * Contract: launch provider catalog — stubs only, no second integrations system.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = readFileSync(join(root, 'lib/platform/launch-provider-catalog.ts'), 'utf8');
const ops = readFileSync(join(root, 'lib/platform-ops.ts'), 'utf8');
const stack = readFileSync(join(root, 'docs/EA-Core-Technology-Stack.md'), 'utf8');
const gate = readFileSync(join(root, 'docs/INTEGRATION-GATE.md'), 'utf8');

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

assert(catalog.includes("id: 'omniroute'"), 'OmniRoute registered');
assert(catalog.includes("id: 'scrapling'"), 'Scrapling registered');
assert(catalog.includes("id: 'onlook'"), 'Onlook registered');
assert(catalog.includes("id: 'postiz'"), 'Postiz future placeholder');
assert(catalog.includes("status: 'not_installed'"), 'Future queue Not Installed');
assert(catalog.includes("status: 'disabled_not_configured'"), 'Optional disabled until configured');
assert(catalog.includes('customerFacing: false'), 'Providers not customer-facing by default');
assert(ops.includes('launchProvidersAsOpsSubsystems'), 'Ops reuses catalog — no second dashboard');
assert(stack.includes('Every new tool must reduce complexity'), 'Stack principle present');
assert(gate.includes('Build fewer things'), 'Gate principle present');
assert(!catalog.includes('createIntegrationsDashboard'), 'No second dashboard');

console.log('PASS: launch provider catalog + stack freeze contracts');
