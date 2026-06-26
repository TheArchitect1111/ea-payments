import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const requiredFiles = [
  'app/api/ai/route.ts',
  'app/api/orchestrator/route.ts',
  'app/api/agents/research/route.ts',
  'lib/ai/gateway.ts',
  'lib/ai/config.ts',
  'lib/ai/security.ts',
  'lib/agents/types.ts',
  'lib/agents/registry.ts',
  'lib/agents/orchestrator.ts',
  'lib/agents/research-agent.ts',
  'docs/ai-architecture.md',
  'docs/agent-framework.md',
  'docs/research-agent.md',
];

for (const file of requiredFiles) {
  assert.equal(existsSync(join(root, file)), true, `${file} should exist`);
}

const registry = readFileSync(join(root, 'lib/agents/registry.ts'), 'utf8');
assert.match(registry, /registerAgent\(researchAgent\)/, 'Research agent should be registered');
assert.match(registry, /matchAgents/, 'Registry should expose dynamic matching');
assert.doesNotMatch(registry, /switch\s*\(/, 'Registry should not use switch statements');

const orchestrator = readFileSync(join(root, 'lib/agents/orchestrator.ts'), 'utf8');
assert.match(orchestrator, /matchAgents/, 'Orchestrator should use registry matching');
assert.doesNotMatch(orchestrator, /switch\s*\(/, 'Orchestrator should not hardcode agent routing with switches');

const orb = readFileSync(join(root, 'app/components/ea-guide/EAGuideOrb.tsx'), 'utf8');
assert.match(orb, /\/api\/orchestrator/, 'Orb should communicate with orchestrator');
assert.doesNotMatch(orb, /\/api\/agents\/research/, 'Orb should not call individual agents');

const gateway = readFileSync(join(root, 'lib/ai/gateway.ts'), 'utf8');
assert.match(gateway, /conversationHistory/, 'Gateway should manage conversation history');
assert.match(gateway, /checkRateLimit/, 'Gateway should apply rate limiting');
assert.match(gateway, /detectPromptInjection/, 'Gateway should check prompt injection signals');
assert.match(gateway, /streamAIGateway/, 'Gateway should expose streaming');

console.log('EA Agent Framework checks passed.');
