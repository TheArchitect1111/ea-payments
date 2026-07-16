#!/usr/bin/env node
/**
 * Open Design architecture contract — file presence and story gate logic.
 * Run: node scripts/test-open-design-contract.mjs
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

const required = [
  'docs/OPEN-DESIGN-ARCHITECTURE.md',
  'lib/open-design/index.ts',
  'lib/open-design/types.ts',
  'lib/open-design/pipeline.ts',
  'lib/open-design/brief-generator.ts',
  'lib/open-design/industry-library.ts',
  'lib/open-design/output-contract.ts',
  'lib/open-design/creative-status.ts',
  'lib/open-design/ctp-integration.ts',
  'lib/open-design/implementation-runner.ts',
  'lib/agents/open-design-agent.ts',
];

for (const rel of required) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const pipeline = readFileSync(join(root, 'lib/open-design/pipeline.ts'), 'utf8');
assert(pipeline.includes('validateStoryGate'), 'pipeline must export story gate');
assert(pipeline.includes('open.design.story.extracted'), 'pipeline must emit open.design pulse types');

const brief = readFileSync(join(root, 'lib/open-design/brief-generator.ts'), 'utf8');
assert(brief.includes('generateCreativeExperienceBrief'), 'brief generator must exist');
assert(brief.includes('buildDualBriefFromCtp'), 'CTP dual brief bridge required');

const bridge = readFileSync(join(root, 'lib/ctp-studio-bridge.ts'), 'utf8');
assert(bridge.includes('beginOpenDesignFromCtp'), 'CTP studio bridge must start Open Design');

const pulse = readFileSync(join(root, 'lib/pulse-bus.ts'), 'utf8');
assert(pulse.includes('open.design.story.blocked'), 'pulse bus must include open.design events');
assert(pulse.includes('open.design.deploy.preview'), 'pulse bus must include deploy preview event');

const runner = readFileSync(join(root, 'lib/open-design/implementation-runner.ts'), 'utf8');
assert(runner.includes('runOpenDesignImplementationHandoff'), 'implementation runner required');
assert(runner.includes('createGithubPullRequest') || runner.includes('github-pr'), 'GitHub PR handoff required');

const factory = readFileSync(join(root, 'lib/ea-factory.ts'), 'utf8');
assert(factory.includes('ea-open-design'), 'EA Factory must register open design protocol');

const registry = readFileSync(join(root, 'lib/agents/registry.ts'), 'utf8');
assert(registry.includes('openDesignAgent'), 'agent registry must register open-design agent');

const rules = readFileSync(join(root, 'lib/open-design/creative-rules.ts'), 'utf8');
assert(rules.includes('Story before layout'), 'standing design rules required');

if (failures.length) {
  console.error('open-design contract: FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('open-design contract: PASS');
