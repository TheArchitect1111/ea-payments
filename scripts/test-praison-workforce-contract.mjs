#!/usr/bin/env node
/**
 * PraisonAI workforce architecture contract — file presence and integration wiring.
 * Run: node scripts/test-praison-workforce-contract.mjs
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
  'docs/PRAISONAI-ARCHITECTURE.md',
  'lib/praison-ai/index.ts',
  'lib/praison-ai/types.ts',
  'lib/praison-ai/workforce-registry.ts',
  'lib/praison-ai/specialist-runner.ts',
  'lib/praison-ai/executive-agent.ts',
  'lib/praison-ai/qa-agent.ts',
  'lib/praison-ai/orchestrator.ts',
  'lib/praison-ai/knowledge-graph.ts',
  'lib/praison-ai/make-bridge.ts',
  'lib/praison-ai/mission-control.ts',
  'lib/praison-ai/client.ts',
];

for (const rel of required) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const registry = readFileSync(join(root, 'lib/praison-ai/workforce-registry.ts'), 'utf8');
assert(registry.includes('PRAISON_WORKFORCE'), 'workforce registry required');
assert(registry.includes('FUTURE_WORKFORCE_AGENTS'), 'future agent extension list required');

const orchestrator = readFileSync(join(root, 'lib/praison-ai/orchestrator.ts'), 'utf8');
assert(orchestrator.includes('runPraisonWorkforce'), 'orchestrator must export runPraisonWorkforce');
assert(orchestrator.includes('schedulePraisonWorkforce'), 'orchestrator must export schedulePraisonWorkforce');
assert(orchestrator.includes('runQaValidation'), 'QA gate required');

const qa = readFileSync(join(root, 'lib/praison-ai/qa-agent.ts'), 'utf8');
assert(qa.includes('passed'), 'QA agent must validate outputs');

const makeBridge = readFileSync(join(root, 'lib/praison-ai/make-bridge.ts'), 'utf8');
assert(makeBridge.includes('praison.package.ready'), 'Make bridge must emit praison.package.ready');

const intake = readFileSync(join(root, 'lib/ctp-intake-orchestrator.ts'), 'utf8');
assert(intake.includes('schedulePraisonWorkforce'), 'CTP intake must schedule Praison workforce');

const submissions = readFileSync(join(root, 'lib/ctp-submissions.ts'), 'utf8');
assert(submissions.includes('workforcePackage'), 'CTP submissions must persist workforcePackage');

const pulse = readFileSync(join(root, 'lib/pulse-bus.ts'), 'utf8');
assert(pulse.includes('praison.workforce.started'), 'pulse bus must include praison events');
assert(pulse.includes('praison.package.ready'), 'pulse bus must include package ready event');

const factory = readFileSync(join(root, 'lib/ea-factory.ts'), 'utf8');
assert(factory.includes('ea-praison-ai'), 'EA Factory must register praison protocol');

const brief = readFileSync(join(root, 'lib/open-design/brief-generator.ts'), 'utf8');
assert(brief.includes('workforcePackage'), 'Open Design must consume workforce package');

const mission = readFileSync(join(root, 'lib/mission-control-data.ts'), 'utf8');
assert(mission.includes('buildWorkforceAttentionItems'), 'Mission Control must include workforce lane');

if (failures.length) {
  console.error('praison-workforce contract: FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('praison-workforce contract: PASS');
