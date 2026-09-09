import { getAIGatewayConfig } from '@/lib/ai/config';
import { runAIGateway } from '@/lib/ai/gateway';
import { sanitizeContextValue } from '@/lib/ai/security';
import type { AIRequestContext } from '@/lib/ai/types';
import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';

type CreativeDefinition = {
  name: string;
  label: string;
  mission: string;
  capabilities: string[];
  rules: string[];
};

const EA_CREATIVE_CONSTITUTION = [
  'Guide, do not lecture. Prefer human, useful language over SaaS jargon.',
  'Lead with the audience reality and desired outcome before features or architecture.',
  'Demonstrate important claims visually or concretely. Do not rely on explanation when proof can be shown.',
  'Every page or campaign must make its differentiation explicit: why this instead of the common alternative?',
  'Use one coherent visual direction per experience. Control palette, typography, icon family, image treatment, spacing rhythm, and motion.',
  'Do not invent proof, testimonials, performance data, partnerships, scarcity, or outcomes.',
  'Reject generic copy, irrelevant imagery, repetitive layouts, and feature dumps.',
  'A visitor should understand the value without needing the creator to explain what the design was trying to communicate.',
  'Mobile composition is a first-class acceptance criterion, not a cleanup step.',
];

const CREATIVE_SPECIALISTS: CreativeDefinition[] = [
  {
    name: 'behavioral-marketing',
    label: 'Behavioral Marketing Agent',
    mission: 'Identify the audience truth, psychological tension, desired shift, objections, proof needs, and conversion logic before creative work begins.',
    capabilities: ['marketing brain', 'behavioral marketing', 'audience psychology', 'buyer psychology', 'conversion psychology', 'positioning', 'differentiation', 'persuasion'],
    rules: [
      'Define audience, tension, desired transformation, competing alternative, differentiation, proof, objection, and next action.',
      'Do not manipulate fear, shame, false urgency, or hidden incentives.',
    ],
  },
  {
    name: 'story-architect',
    label: 'Story Architect',
    mission: 'Design the visitor or audience journey so each beat changes what the person feels, understands, or believes.',
    capabilities: ['story architecture', 'narrative', 'page flow', 'landing page story', 'campaign story', 'emotional sequence', 'visitor journey'],
    rules: [
      'Design a sequence of recognition, tension, possibility, differentiation, proof, control, outcome, and action when appropriate.',
      'Do not turn the experience into a list of sections. Every beat must earn the next beat.',
    ],
  },
  {
    name: 'language-director',
    label: 'Language Director',
    mission: 'Turn strategy into clear, guided, specific language that sounds human and earns attention without sounding like generic software marketing.',
    capabilities: ['language agent', 'copy direction', 'guide voice', 'copywriting', 'messaging', 'headline', 'microcopy', 'voice', 'wording'],
    rules: [
      'Guide, do not instruct unless an instruction is genuinely required.',
      'Prefer concrete outcomes and recognizable human situations over abstract claims.',
      'Avoid SaaS sludge such as unlock, supercharge, seamless, game-changing, revolutionary, leverage, and generic AI-first claims unless literally necessary.',
      'Use short sentences for high-emotion moments. Use explanation only where it increases understanding.',
      'If a sentence could belong to almost any competitor, rewrite it.',
    ],
  },
  {
    name: 'visual-director',
    label: 'Visual Director',
    mission: 'Create one coherent art direction and specify how imagery, typography, icons, color, layout, motion, and product UI should carry the story.',
    capabilities: ['visual director', 'art direction', 'visual strategy', 'design system', 'color palette', 'typography', 'icon system', 'image direction', 'mobile composition'],
    rules: [
      'Choose one primary palette plus a controlled accent strategy. Do not let individual sections invent unrelated colors.',
      'Use emotional imagery where human recognition matters and product UI where proof matters.',
      'Every image must have a narrative job and visually match the business, audience, and claim it supports.',
      'Specify mobile behavior for large type, grids, cards, product mockups, and transitions.',
    ],
  },
  {
    name: 'product-demonstration',
    label: 'Product Demonstration Agent',
    mission: 'Translate capabilities into believable on-screen demonstrations so the audience can see the product doing the work.',
    capabilities: ['product demo', 'product demonstration', 'show not tell', 'ui demo', 'proof', 'workflow demo', 'sample output', 'search demo'],
    rules: [
      'For every major capability claim, define the concrete visual proof that should appear within one screen of the claim.',
      'Use realistic sample inputs and outputs with one consistent example business or persona unless multiple examples are strategically required.',
      'Clearly label simulated or illustrative data and never present fabricated performance as real.',
    ],
  },
  {
    name: 'creative-critic',
    label: 'Creative Critic',
    mission: 'Act as a hard quality gate. Reject work that is generic, confusing, visually incoherent, weakly differentiated, unsupported, or dependent on explanation.',
    capabilities: ['creative critic', 'creative qa', 'marketing qa', 'copy qa', 'visual qa', 'quality gate', 'red team creative', 'brain critic'],
    rules: [
      'Score clarity, differentiation, emotional relevance, language quality, visual coherence, proof, conversion logic, and mobile readability from 0 to 10.',
      'A score below 8 in clarity, differentiation, language quality, visual coherence, or proof is a blocking failure.',
      'Name the exact failure and send the work back to the responsible specialist with a concrete revision instruction.',
      'Do not approve technically complete work that is creatively weak.',
    ],
  },
];

function normalizeResult(name: string, value: unknown): AgentExecutionResult {
  const data = value as Partial<AgentExecutionResult>;
  return {
    agent: name,
    summary: String(data.summary ?? 'Creative Brain review completed.'),
    keyFindings: Array.isArray(data.keyFindings) ? data.keyFindings : [],
    opportunities: Array.isArray(data.opportunities) ? data.opportunities : [],
    risks: Array.isArray(data.risks) ? data.risks : [],
    recommendedNextSteps: Array.isArray(data.recommendedNextSteps) ? data.recommendedNextSteps.map(String) : [],
    confidence: Math.max(0, Math.min(1, Number(data.confidence ?? 0.65))),
    sources: Array.isArray(data.sources) ? data.sources.map(String) : [],
    raw: value,
  };
}

function createCreativeAgent(definition: CreativeDefinition): EAAgent {
  return {
    name: definition.name,
    description: `${definition.label} — ${definition.mission}`,
    capabilities: definition.capabilities,
    permissions: [
      { id: 'read_user_context', description: 'Read approved project, audience, brand, and prior Brain context.' },
      { id: 'use_ai_gateway', description: 'Generate structured creative direction through the central AI Gateway.' },
    ],
    status() {
      return process.env.OPENAI_API_KEY ? 'available' : 'degraded';
    },
    async health(): Promise<AgentHealth> {
      return {
        name: definition.name,
        status: this.status(),
        checkedAt: new Date().toISOString(),
        details: process.env.OPENAI_API_KEY ? 'Creative Brain can use the AI Gateway.' : 'OPENAI_API_KEY is not configured.',
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
        maxOutputTokens: 2600,
        promptVersion: `creative-brain-${definition.name}-v1`,
        system: [
          `You are the Efficiency Architects ${definition.label}.`,
          `Mission: ${definition.mission}`,
          'EA Creative Constitution:',
          ...EA_CREATIVE_CONSTITUTION.map((rule) => `- ${rule}`),
          'Specialist rules:',
          ...definition.rules.map((rule) => `- ${rule}`),
          'Separate verified facts, assumptions, illustrative examples, and recommendations.',
          'Do not claim production completion, publication, deployment, or measured performance without evidence.',
        ].join('\n'),
        messages: [{
          role: 'user',
          content: [
            'Return only valid JSON with this exact shape:',
            '{"summary":"string","keyFindings":[{"title":"string","detail":"string"}],"opportunities":[{"title":"string","detail":"string"}],"risks":[{"title":"string","detail":"string"}],"recommendedNextSteps":["string"],"confidence":0.0,"sources":["string"]}',
            `Intent: ${input.intent}`,
            `Request: ${input.query}`,
            projectContext ? `Approved and prior Brain context:\n${projectContext}` : 'No additional approved project context was supplied.',
          ].join('\n\n'),
        }],
        metadata: { agent: definition.name, intent: input.intent, layer: 'ea-creative-brain' },
      }, context);

      try {
        return normalizeResult(definition.name, JSON.parse(response.text));
      } catch {
        return {
          agent: definition.name,
          summary: response.text,
          keyFindings: [],
          opportunities: [],
          risks: [{ title: 'Structured parsing failed', detail: 'The Creative Brain output must be reviewed before downstream execution.' }],
          recommendedNextSteps: ['Retry this Brain stage with the same approved context.'],
          confidence: 0.3,
          sources: [],
          raw: response.text,
        };
      }
    },
  };
}

export const creativeBrainAgents = CREATIVE_SPECIALISTS.map(createCreativeAgent);
export const creativeBrainAgentNames = CREATIVE_SPECIALISTS.map((agent) => agent.name);
export { EA_CREATIVE_CONSTITUTION };
