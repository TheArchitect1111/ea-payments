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
  'lib/agents/amplifi-content-director-agent.ts',
  'lib/agents/specialist-agents.ts',
  'lib/context-optimizer/index.ts',
  'lib/agent-reliability/client.ts',
  'docs/ai-architecture.md',
  'docs/agent-framework.md',
  'docs/research-agent.md',
];

for (const file of requiredFiles) {
  assert.equal(existsSync(join(root, file)), true, `${file} should exist`);
}

const registry = readFileSync(join(root, 'lib/agents/registry.ts'), 'utf8');
assert.match(registry, /registerAgent\(researchAgent\)/, 'Research agent should be registered');
assert.match(registry, /registerAgent\(amplifiContentDirectorAgent\)/, 'Amplifi Content Director should be registered');
assert.match(registry, /specialistAgents\.forEach\(registerAgent\)/, 'Curated specialists should be registered');
assert.match(registry, /matchAgents/, 'Registry should expose dynamic matching');
assert.match(registry, /normalizeAgentName/, 'Registry should normalize selector aliases');
assert.doesNotMatch(registry, /switch\s*\(/, 'Registry should not use switch statements');

const orchestrator = readFileSync(join(root, 'lib/agents/orchestrator.ts'), 'utf8');
assert.match(orchestrator, /matchAgents/, 'Orchestrator should use registry matching');
assert.match(orchestrator, /optimizeContext/, 'Live orchestrator should optimize retrieved context before agent calls');
assert.match(orchestrator, /verifyAgentCompletion/, 'Live orchestrator should verify completion evidence');
assert.match(orchestrator, /orchestrator\.reliability/, 'Live orchestrator should log reliability results');
assert.match(orchestrator, /__eaOptimizedContext/, 'Optimized context should be passed into agent execution');
assert.doesNotMatch(orchestrator, /switch\s*\(/, 'Orchestrator should not hardcode agent routing with switches');

const types = readFileSync(join(root, 'lib/agents/types.ts'), 'utf8');
assert.match(types, /reliability:/, 'Orchestrator response should expose reliability metadata');
assert.match(types, /reductionRatio/, 'Orchestrator response should expose context reduction metrics');

const amplifiDirector = readFileSync(join(root, 'lib/agents/amplifi-content-director-agent.ts'), 'utf8');
assert.match(amplifiDirector, /name:\s*['"]amplifi-content-director['"]/, 'Amplifi Content Director should expose the expected agent name');
assert.match(amplifiDirector, /Never publish, send, schedule, delete/, 'Amplifi Content Director should preserve the approval boundary');

const ideaBoxRoute = readFileSync(join(root, 'app/api/portal/amplifi/idea-box/route.ts'), 'utf8');
assert.match(ideaBoxRoute, /getAgent\(['"]amplifi-content-director['"]\)/, 'Idea Box should use Amplifi Content Director');

const campaignRoute = readFileSync(join(root, 'app/api/portal/amplifi/create-campaign/route.ts'), 'utf8');
assert.match(campaignRoute, /getAgent\(['"]amplifi-content-director['"]\)/, 'Campaign creation should use Amplifi Content Director');

const specialists = readFileSync(join(root, 'lib/agents/specialist-agents.ts'), 'utf8');
for (const name of ['seo', 'conversion', 'social-media', 'email-campaign', 'brand', 'accessibility', 'performance', 'security', 'analytics']) {
  assert.match(specialists, new RegExp(`name: ['"]${name}['"]`), `${name} specialist should exist`);
}

const route = readFileSync(join(root, 'app/api/orchestrator/route.ts'), 'utf8');
assert.match(route, /agents: listAgents\(\)/, 'Orchestrator metadata should expose agents for a selector');

const orb = readFileSync(join(root, 'app/components/ea-guide/EAGuideOrb.tsx'), 'utf8');
assert.match(orb, /\/api\/orchestrator/, 'Orb should communicate with orchestrator');
assert.doesNotMatch(orb, /\/api\/agents\/research/, 'Orb should not call individual agents');

const gateway = readFileSync(join(root, 'lib/ai/gateway.ts'), 'utf8');
assert.match(gateway, /conversationHistory/, 'Gateway should manage conversation history');
assert.match(gateway, /checkRateLimit/, 'Gateway should apply rate limiting');
assert.match(gateway, /detectPromptInjection/, 'Gateway should check prompt injection signals');
assert.match(gateway, /streamAIGateway/, 'Gateway should expose streaming');

console.log('EA Agent Framework checks passed.');
