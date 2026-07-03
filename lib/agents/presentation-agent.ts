import { getAIGatewayConfig } from '@/lib/ai/config';
import { runAIGateway } from '@/lib/ai/gateway';
import { sanitizeContextValue } from '@/lib/ai/security';
import type { AIRequestContext } from '@/lib/ai/types';
import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';
import type { MasterPresentationPackage } from '@/lib/master-presentation-schema';

const PRESENTATION_CAPABILITIES = [
  'executive presentation',
  'capabilities deck',
  'training experience',
  'transformation story',
  'keynote narrative',
  'leave-behind',
  'roi discussion',
  'speaker notes',
];

function normalizePresentationPackage(value: unknown): MasterPresentationPackage | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<MasterPresentationPackage>;
  if (!Array.isArray(data.slides) || !data.deliverables) return null;
  if (!data.organizationName || !data.productName) return null;
  return {
    version: String(data.version ?? '1.0.0'),
    generatedAt: String(data.generatedAt ?? new Date().toISOString()),
    organizationName: String(data.organizationName),
    productName: String(data.productName),
    audience: String(data.audience ?? 'Executive leadership'),
    industry: String(data.industry ?? 'Organization'),
    slides: data.slides,
    deliverables: data.deliverables,
    aiEnhanced: true,
  };
}

function buildPresentationPrompt(input: AgentExecutionInput) {
  const context = Object.entries(input.context ?? {})
    .map(([key, value]) => `${key}: ${sanitizeContextValue(value)}`)
    .join('\n');

  return [
    'Return only valid JSON matching MasterPresentationPackage shape:',
    '{',
    '  "version": "1.0.0",',
    '  "generatedAt": "ISO timestamp",',
    '  "organizationName": "string",',
    '  "productName": "Training Experience™",',
    '  "audience": "string",',
    '  "industry": "string",',
    '  "aiEnhanced": true,',
    '  "slides": [',
    '    {',
    '      "id": "current-reality|hidden-cost|imagine-possible|philosophy|transformation|how-system-works|interactive-experience|accessibility|manager-experience|ai-assistant|automation|business-impact|why-different|future-vision|call-to-action",',
    '      "title": "string",',
    '      "purpose": "string",',
    '      "headline": "string — ONE powerful idea",',
    '      "supportingContent": ["string — minimal bullets, prefer visual concepts"],',
    '      "suggestedVisual": "string",',
    '      "suggestedDiagram": "string optional",',
    '      "speakerNotes": "string",',
    '      "transition": "string",',
    '      "timingSeconds": 60',
    '    }',
    '  ],',
    '  "deliverables": {',
    '    "executiveSummary": "string",',
    '    "leaveBehind": "string",',
    '    "proposalSummary": "string",',
    '    "roiDiscussionPoints": ["string"],',
    '    "faq": [{"question":"string","answer":"string"}],',
    '    "objections": [{"objection":"string","response":"string"}],',
    '    "implementationRoadmap": [{"phase":"string","detail":"string"}],',
    '    "assetChecklist": ["string"],',
    '    "imageChecklist": ["string"],',
    '    "dashboardMockupNotes": ["string"],',
    '    "videoRecommendations": ["string"]',
    '  }',
    '}',
    '',
    'Standards:',
    '- This is NOT a sales deck or feature walkthrough — it is a transformation story.',
    '- Never criticize competitors; show evolution from LMS to Training Experience™.',
    '- Technology supports people; accessibility is foundational, not an afterthought.',
    '- End emotionally with possibility, not pricing.',
    '- Every slide communicates ONE powerful idea. Guide. Inspire. Educate.',
    '',
    'Intent:',
    input.intent,
    '',
    'Request:',
    input.query,
    '',
    context ? `Context:\n${context}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const presentationAgent: EAAgent = {
  name: 'presentation',
  description: 'Generates executive capabilities presentations and leave-behind packages for Training Experience™.',
  capabilities: PRESENTATION_CAPABILITIES,
  permissions: [{ id: 'ai:generate', description: 'Generate structured presentation JSON via AI gateway' }],

  async execute(input, context, runtime) {
    const gateway = runtime?.gateway ?? runAIGateway;
    const config = getAIGatewayConfig();
    const response = await gateway(
      {
        model: config.defaultModel,
        conversationId: input.conversationId,
        responseFormat: 'json',
        maxOutputTokens: 8000,
        promptVersion: 'presentation-agent-v1',
        system: [
          'You are the Efficiency Architects Master Presentation Generator.',
          'Create world-class executive capabilities presentations — transformation stories, not sales decks.',
          'Training Experience™ is the product. Experience Chassis™ is the platform.',
          'Never attack competitors. End with possibility, not pricing.',
        ].join('\n'),
        messages: [{ role: 'user', content: buildPresentationPrompt(input) }],
        metadata: { agent: 'presentation', intent: input.intent },
      },
      context,
    );

    let parsed: MasterPresentationPackage | null = null;
    try {
      parsed = normalizePresentationPackage(JSON.parse(response.text));
    } catch {
      parsed = null;
    }

    const result: AgentExecutionResult = {
      agent: 'presentation',
      summary: parsed
        ? `Generated ${parsed.slides.length}-slide capabilities presentation for ${parsed.organizationName}.`
        : 'Presentation generation completed with partial structure.',
      keyFindings: parsed?.slides.slice(0, 4).map((s) => ({ title: s.headline, detail: s.purpose })) ?? [],
      opportunities: [],
      risks: parsed ? [] : [{ title: 'Structured parsing failed', detail: 'Review raw presentation output.' }],
      recommendedNextSteps: parsed?.deliverables.implementationRoadmap.map((r) => `${r.phase}: ${r.detail}`) ?? [],
      confidence: parsed ? 0.85 : 0.4,
      sources: [],
      raw: parsed ?? response.text,
    };

    return result;
  },

  async health(): Promise<AgentHealth> {
    try {
      getAIGatewayConfig();
      return { name: 'presentation', status: 'available', checkedAt: new Date().toISOString() };
    } catch {
      return {
        name: 'presentation',
        status: 'degraded',
        checkedAt: new Date().toISOString(),
        details: 'OPENAI_API_KEY not configured — rule-based fallback only.',
      };
    }
  },

  status() {
    return 'available' as const;
  },
};

export async function generateMasterPresentationWithAI(
  input: {
    organizationName: string;
    productName?: string;
    audience?: string;
    industry?: string;
    sourceText?: string;
    notes?: string;
  },
  aiContext: AIRequestContext,
): Promise<MasterPresentationPackage | null> {
  try {
    getAIGatewayConfig();
  } catch {
    return null;
  }

  const result = await presentationAgent.execute(
    {
      intent: 'master-presentation',
      query: `Create a world-class executive capabilities presentation for ${input.organizationName}.`,
      context: {
        organizationName: input.organizationName,
        productName: input.productName ?? 'Training Experience™',
        audience: input.audience ?? 'Executive leadership',
        industry: input.industry ?? 'Organization',
        sourceText: input.sourceText?.slice(0, 12000) ?? '',
        notes: input.notes ?? '',
      },
    },
    aiContext,
  );

  return normalizePresentationPackage(result.raw);
}
