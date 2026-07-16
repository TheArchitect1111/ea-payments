import { researchAgent } from '@/lib/agents/research-agent';
import { intakeAgent } from '@/lib/agents/intake-agent';
import { presentationAgent } from '@/lib/agents/presentation-agent';
import { platformGuardianAgent } from '@/lib/agents/platform-guardian-agent';
import { openDesignAgent } from '@/lib/agents/open-design-agent';
import type { EAAgent } from '@/lib/agents/types';

const agents = new Map<string, EAAgent>();

export function registerAgent(agent: EAAgent) {
  agents.set(agent.name, agent);
}

export function getAgent(name: string) {
  return agents.get(name);
}

export function listAgents() {
  return Array.from(agents.values());
}

export function matchAgents(input: string, requestedAgents: string[] = []) {
  const requested = requestedAgents.map((name) => agents.get(name)).filter((agent): agent is EAAgent => Boolean(agent));
  if (requested.length) return requested;

  const normalized = input.toLowerCase();
  const scored = listAgents()
    .map((agent) => {
      const score = agent.capabilities.reduce((total, capability) => {
        const words = capability.toLowerCase().split(/\s+/);
        return total + words.filter((word) => normalized.includes(word)).length;
      }, 0);
      return { agent, score };
    })
    .sort((a, b) => b.score - a.score);

  const matches = scored.filter((item) => item.score > 0).map((item) => item.agent);
  return matches.length ? matches : [researchAgent];
}

registerAgent(researchAgent);
registerAgent(intakeAgent);
registerAgent(presentationAgent);
registerAgent(platformGuardianAgent);
registerAgent(openDesignAgent);
