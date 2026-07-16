import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';
import {
  generateCreativeExperienceBrief,
  STANDING_DESIGN_RULES,
  validateStoryGate,
  type ExecutiveIntelligenceInput,
} from '@/lib/open-design';

const OPEN_DESIGN_CAPABILITIES = [
  'story extraction',
  'creative direction',
  'art direction',
  'homepage concept',
  'portal experience',
  'dashboard design',
  'landing page',
  'presentation design',
  'component library',
  'creative dna',
  'visual experience',
];

/**
 * Open Design agent — Creative Experience Engine facade.
 * Never performs operational analysis (research/audit/finance remain other agents).
 */
export const openDesignAgent: EAAgent = {
  name: 'open-design',
  description:
    'Translates executive intelligence into premium creative direction and experience concepts. Visual design department of EA.',
  capabilities: OPEN_DESIGN_CAPABILITIES,
  permissions: [
    { id: 'creative-studio-read', description: 'Read Creative Studio campaigns and brand profiles' },
    { id: 'creative-brief-write', description: 'Generate creative experience briefs' },
    { id: 'pulse-emit', description: 'Emit Open Design pipeline Pulse events' },
  ],

  async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const ctx = input.context ?? {};
    const intel: ExecutiveIntelligenceInput = {
      organizationId: String(ctx.organizationId ?? 'ea'),
      organizationName: String(ctx.organizationName ?? 'Organization'),
      industry: ctx.industry ? String(ctx.industry) : undefined,
      mission: ctx.mission ? String(ctx.mission) : undefined,
      audience: ctx.audience ? String(ctx.audience) : undefined,
      executiveSummary: ctx.executiveSummary ? String(ctx.executiveSummary) : input.query,
      differentiators: Array.isArray(ctx.differentiators)
        ? ctx.differentiators.map(String)
        : undefined,
    };

    const brief = generateCreativeExperienceBrief(intel);
    const storyGate = validateStoryGate(brief.profile.story);

    if (!storyGate.ok) {
      return {
        agent: 'open-design',
        summary: 'Story gate blocked — design cannot begin without a one-sentence story.',
        keyFindings: [{ title: 'Story required', detail: storyGate.reason }],
        opportunities: [],
        risks: [{ title: 'Generic design risk', detail: 'Proceeding without story produces corporate-generic output.' }],
        recommendedNextSteps: [
          'Complete executive intelligence / CTP intake until a one-sentence story is clear.',
          'Re-run Open Design when story sentence is validated.',
        ],
        confidence: 0.95,
        sources: ['lib/open-design/pipeline.ts'],
        raw: brief,
      };
    }

    return {
      agent: 'open-design',
      summary: `Creative direction ready for ${brief.profile.organizationName}. Editorial style: ${brief.profile.creativeDna?.editorialStyle ?? brief.profile.editorialStyle}.`,
      keyFindings: [
        { title: 'Story sentence', detail: brief.profile.story.sentence },
        { title: 'Creative DNA', detail: brief.profile.creativeDna?.emotionalTone ?? 'See brief' },
      ],
      opportunities: brief.deliverables.map((d) => ({
        title: d.title,
        detail: d.storyBeat,
      })),
      risks: (brief.profile.creativeDna?.antiPatterns ?? []).slice(0, 3).map((p) => ({
        title: 'Anti-pattern',
        detail: p,
      })),
      recommendedNextSteps: [
        'Review creative brief in Creative Studio / Mission Control.',
        'Hand off Cursor package via buildCursorHandoffPackage.',
        ...STANDING_DESIGN_RULES.slice(0, 2),
      ],
      confidence: 0.82,
      sources: ['lib/open-design/brief-generator.ts', 'lib/open-design/industry-library.ts'],
      raw: brief,
    };
  },

  async health(): Promise<AgentHealth> {
    return {
      name: 'open-design',
      status: 'available',
      checkedAt: new Date().toISOString(),
      details: 'Creative Experience Engine — story-gated pipeline active.',
    };
  },
};
