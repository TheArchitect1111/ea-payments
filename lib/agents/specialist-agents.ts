import { getAIGatewayConfig } from '@/lib/ai/config';
import { runAIGateway } from '@/lib/ai/gateway';
import { sanitizeContextValue } from '@/lib/ai/security';
import type { AIRequestContext } from '@/lib/ai/types';
import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';

type SpecialistDefinition = {
  name: string;
  label: string;
  mission: string;
  capabilities: string[];
  boundaries: string[];
};

const SPECIALISTS: SpecialistDefinition[] = [
  {
    name: 'seo',
    label: 'SEO Strategist',
    mission: 'Improve discoverability without weakening the client story or making unsupported claims.',
    capabilities: ['seo', 'search optimization', 'search intent', 'keywords', 'metadata', 'structured data', 'indexing', 'internal links'],
    boundaries: ['Do not keyword-stuff, invent locations or credentials, change approved offers, publish changes, or promise rankings.'],
  },
  {
    name: 'conversion',
    label: 'Conversion Strategist',
    mission: 'Make the next step clear and reduce friction across booking, application, registration, payment, inquiry, and onboarding journeys.',
    capabilities: ['conversion', 'call to action', 'cta', 'funnel', 'form friction', 'booking flow', 'application flow', 'checkout', 'abandonment'],
    boundaries: ['Do not use deceptive urgency, dark patterns, hidden fees, false scarcity, or bypass approval safeguards.'],
  },
  {
    name: 'social-media',
    label: 'Social Media Strategist',
    mission: 'Turn approved client stories, launches, programs, and proof into platform-appropriate campaigns.',
    capabilities: ['social media', 'instagram', 'facebook', 'linkedin', 'social post', 'content calendar', 'campaign cadence', 'content pillars'],
    boundaries: ['Do not auto-publish, fabricate testimonials or engagement, reuse restricted media, or make unsupported regulated claims.'],
  },
  {
    name: 'email-campaign',
    label: 'Email Campaign Strategist',
    mission: 'Design useful, personal-feeling email journeys for onboarding, nurture, reminders, launches, re-engagement, and follow-up.',
    capabilities: ['email campaign', 'email sequence', 'nurture', 'onboarding email', 're-engagement', 'subject line', 'email automation', 'follow-up email'],
    boundaries: ['Do not send messages, add contacts without consent, expose sensitive information, or create sequences without stop conditions.'],
  },
  {
    name: 'brand',
    label: 'Brand Strategist',
    mission: 'Clarify positioning, differentiation, voice, audience priorities, and message architecture.',
    capabilities: ['brand strategy', 'positioning', 'differentiation', 'brand voice', 'message pillars', 'value proposition', 'audience hierarchy'],
    boundaries: ['Do not replace verified facts with fiction, flatten distinct programs, or override approved legal names and regulatory boundaries.'],
  },
  {
    name: 'accessibility',
    label: 'Accessibility Specialist',
    mission: 'Make EA experiences perceivable, operable, understandable, and robust across devices and assistive technologies.',
    capabilities: ['accessibility', 'wcag', 'screen reader', 'keyboard navigation', 'color contrast', 'captions', 'focus order', 'accessible forms'],
    boundaries: ['Do not claim legal compliance from automated checks alone, remove essential functionality, or treat accessibility as cosmetic.'],
  },
  {
    name: 'performance',
    label: 'Performance Engineer',
    mission: 'Protect speed, responsiveness, stability, and efficient infrastructure use.',
    capabilities: ['performance', 'page speed', 'core web vitals', 'bundle size', 'caching', 'image optimization', 'latency', 'runtime performance'],
    boundaries: ['Do not remove required content merely to improve scores, change infrastructure without approval, or claim improvement without measurement.'],
  },
  {
    name: 'security',
    label: 'Security Reviewer',
    mission: 'Identify practical security and privacy risks before they become production incidents.',
    capabilities: ['security review', 'cybersecurity', 'privacy risk', 'authentication', 'authorization', 'secrets', 'dependency risk', 'threat model', 'file upload security'],
    boundaries: ['Do not expose secrets, perform destructive actions, weaken controls, or certify legal or regulatory compliance.'],
  },
  {
    name: 'analytics',
    label: 'Analytics Specialist',
    mission: 'Define what success means and ensure the platform can measure it accurately.',
    capabilities: ['analytics', 'kpi', 'event taxonomy', 'attribution', 'dashboard metrics', 'conversion tracking', 'data quality', 'reporting cadence'],
    boundaries: ['Do not add tracking without consent review, invent baselines, expose sensitive data, or create metrics with no decision owner.'],
  },
];

function normalizeResult(name: string, value: unknown): AgentExecutionResult {
  const data = value as Partial<AgentExecutionResult>;
  return {
    agent: name,
    summary: String(data.summary ?? 'Specialist review completed.'),
    keyFindings: Array.isArray(data.keyFindings) ? data.keyFindings : [],
    opportunities: Array.isArray(data.opportunities) ? data.opportunities : [],
    risks: Array.isArray(data.risks) ? data.risks : [],
    recommendedNextSteps: Array.isArray(data.recommendedNextSteps) ? data.recommendedNextSteps.map(String) : [],
    confidence: Math.max(0, Math.min(1, Number(data.confidence ?? 0.6))),
    sources: Array.isArray(data.sources) ? data.sources.map(String) : [],
    raw: value,
  };
}

function createSpecialistAgent(definition: SpecialistDefinition): EAAgent {
  return {
    name: definition.name,
    description: `${definition.label} — ${definition.mission}`,
    capabilities: definition.capabilities,
    permissions: [
      { id: 'read_user_context', description: 'Read approved user, project, and page context.' },
      { id: 'use_ai_gateway', description: 'Generate a structured recommendation through the central AI Gateway.' },
    ],
    status() {
      return process.env.OPENAI_API_KEY ? 'available' : 'degraded';
    },
    async health(): Promise<AgentHealth> {
      return {
        name: definition.name,
        status: this.status(),
        checkedAt: new Date().toISOString(),
        details: process.env.OPENAI_API_KEY ? 'AI Gateway provider key is configured.' : 'OPENAI_API_KEY is not configured.',
      };
    },
    async execute(input: AgentExecutionInput, context: AIRequestContext, runtime = {}): Promise<AgentExecutionResult> {
      if (!input.query.trim()) throw new Error(`${definition.label} requires a query.`);
      const gateway = runtime.gateway ?? runAIGateway;
      const config = getAIGatewayConfig();
      const projectContext = Object.entries(input.context ?? {})
        .map(([key, value]) => `${key}: ${sanitizeContextValue(value)}`)
        .join('\n');
      const response = await gateway({
        model: config.defaultModel,
        conversationId: input.conversationId,
        responseFormat: 'json',
        maxOutputTokens: 2200,
        promptVersion: `specialist-${definition.name}-v1`,
        system: [
          `You are the Efficiency Architects ${definition.label}.`,
          `Mission: ${definition.mission}`,
          'Use only approved project context. Separate verified facts, assumptions, and recommendations.',
          'Identify dependencies and approval needs. Provide actionable acceptance criteria.',
          'Nothing may be published, deployed, sent, or changed without the required approval gate.',
          ...definition.boundaries,
        ].join('\n'),
        messages: [{
          role: 'user',
          content: [
            'Return only valid JSON with this exact shape:',
            '{"summary":"string","keyFindings":[{"title":"string","detail":"string"}],"opportunities":[{"title":"string","detail":"string"}],"risks":[{"title":"string","detail":"string"}],"recommendedNextSteps":["string"],"confidence":0.0,"sources":["string"]}',
            `Intent: ${input.intent}`,
            `Request: ${input.query}`,
            projectContext ? `Approved project context:\n${projectContext}` : 'No additional approved project context was supplied.',
          ].join('\n\n'),
        }],
        metadata: { agent: definition.name, intent: input.intent },
      }, context);

      try {
        return normalizeResult(definition.name, JSON.parse(response.text));
      } catch {
        return {
          agent: definition.name,
          summary: response.text,
          keyFindings: [],
          opportunities: [],
          risks: [{ title: 'Structured parsing failed', detail: 'Review the raw specialist output before using it.' }],
          recommendedNextSteps: ['Retry the specialist request with clearer approved context.'],
          confidence: 0.3,
          sources: [],
          raw: response.text,
        };
      }
    },
  };
}

export const specialistAgents = SPECIALISTS.map(createSpecialistAgent);
