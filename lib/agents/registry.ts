import { researchAgent } from '@/lib/agents/research-agent';
import { intakeAgent } from '@/lib/agents/intake-agent';
import { presentationAgent } from '@/lib/agents/presentation-agent';
import { platformGuardianAgent } from '@/lib/agents/platform-guardian-agent';
import { openDesignAgent } from '@/lib/agents/open-design-agent';
import { amplifiContentDirectorAgent } from '@/lib/agents/amplifi-content-director-agent';
import { eaOperationsArchitectAgent } from '@/lib/agents/ea-operations-architect-agent';
import { specialistAgents } from '@/lib/agents/specialist-agents';
import type { EAAgent } from '@/lib/agents/types';

const agents = new Map<string, EAAgent>();

export function registerAgent(agent: EAAgent) {
  agents.set(agent.name, agent);
}

export function getAgent(name: string) {
  return agents.get(normalizeAgentName(name));
}

export function listAgents() {
  return Array.from(agents.values());
}

export function matchAgents(input: string, requestedAgents: string[] = []) {
  const requested = requestedAgents.map((name) => getAgent(name)).filter((agent): agent is EAAgent => Boolean(agent));
  if (requested.length) return requested;

  const normalized = normalizeText(input);
  const scored = listAgents()
    .map((agent) => {
      const score = agent.capabilities.reduce((total, capability) => total + capabilityScore(normalized, capability), 0);
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
registerAgent(amplifiContentDirectorAgent);
registerAgent(eaOperationsArchitectAgent);
specialistAgents.forEach(registerAgent);

const AGENT_ALIASES: Record<string, string> = {
  'seo-strategist': 'seo',
  'conversion-strategist': 'conversion',
  'social': 'social-media',
  'social-media-strategist': 'social-media',
  'amplifi-director': 'amplifi-content-director',
  'content-director': 'amplifi-content-director',
  'amplifi-content-director-agent': 'amplifi-content-director',
  'operations': 'ea-operations-architect',
  'operations-architect': 'ea-operations-architect',
  'operational-architect': 'ea-operations-architect',
  'ea-operations': 'ea-operations-architect',
  'ea-operations-architect-agent': 'ea-operations-architect',
  'email': 'email-campaign',
  'email-campaign-strategist': 'email-campaign',
  'brand-strategist': 'brand',
  'accessibility-specialist': 'accessibility',
  'performance-engineer': 'performance',
  'security-reviewer': 'security',
  'analytics-specialist': 'analytics',
};

function normalizeAgentName(name: string) {
  const normalized = normalizeText(name).replace(/\s+/g, '-');
  return AGENT_ALIASES[normalized] ?? normalized;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function capabilityScore(input: string, capability: string) {
  const phrase = normalizeText(capability);
  if (!phrase) return 0;
  if (input.includes(phrase)) return phrase.includes(' ') ? 6 : 3;
  const meaningfulWords = phrase.split(' ').filter((word) => word.length >= 4);
  return meaningfulWords.filter((word) => input.includes(word)).length;
}
