#!/usr/bin/env node
/**
 * Mission Control surfaces Simplifi Pass 1 ops (DNS / Sentry / uptime).
 * Run: node scripts/test-mission-control-pass1-ops.mjs
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

const ops = join(root, 'lib/simplifi-pass1-ops.ts');
const mc = join(root, 'lib/mission-control-data.ts');
const launch = join(root, 'lib/launch-command-center.ts');
const doc = join(root, 'docs/SIMPLIFI-GOAL-B-OPERATOR.md');

for (const [p, label] of [
  [ops, 'simplifi-pass1-ops'],
  [mc, 'mission-control-data'],
  [launch, 'launch-command-center'],
  [doc, 'operator checklist'],
]) {
  assert(existsSync(p), `missing ${label}`);
}

const opsSrc = readFileSync(ops, 'utf8');
assert(opsSrc.includes('simplifi.ai') || opsSrc.includes('SIMPLIFI_BRAND_URL'), 'branded host required');
assert(opsSrc.includes('probeSimplifiAppDns'), 'DNS probe required');
assert(opsSrc.includes('buildSimplifiPass1AttentionItems'), 'attention builder required');
assert(opsSrc.includes('sentryConfigured'), 'sentry helper required');
assert(opsSrc.includes('monitoringConfigured') || opsSrc.includes('GLITCHTIP'), 'GlitchTip monitoring required');
assert(opsSrc.includes('uptimeConfigured'), 'uptime helper required');
assert(opsSrc.includes('GLITCHTIP-SETUP') || opsSrc.includes('GlitchTip'), 'Pass 1 should point at GlitchTip docs');

const mcSrc = readFileSync(mc, 'utf8');
assert(mcSrc.includes('buildSimplifiPass1AttentionItems'), 'Mission Control must import Pass 1 attention');
assert(mcSrc.includes('launchOpsAttentionEvents'), 'Mission Control must emit launch ops events');
assert(mcSrc.includes('...launchOpsSignals'), 'Mission Control must merge launch ops signals');

const launchSrc = readFileSync(launch, 'utf8');
assert(launchSrc.includes('probeSimplifiAppDns'), 'launch center must probe Simplifi DNS');
assert(launchSrc.includes('uptime_dashboard'), 'launch center must include uptime checklist item');
assert(launchSrc.includes('Simplifi Pass 1'), 'recommendNextAction should prioritize Pass 1');

const docSrc = readFileSync(doc, 'utf8');
assert(docSrc.includes('/admin/master'), 'operator doc should point at Mission Control');

if (failures.length) {
  console.error('mission-control pass1 ops: FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('mission-control pass1 ops: PASS');
