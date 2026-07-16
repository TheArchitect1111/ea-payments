/**
 * Cursor handoff contract — Open Design outputs must be implementation-ready.
 */

import type { CreativeExperienceBrief, ExperienceDeliverableKind } from './types';

export interface DesignTokenHandoff {
  /** Reference @/lib/design-system — never ad-hoc hex in production */
  source: '@/lib/design-system';
  primary: string;
  secondary: string;
  accent?: string;
  typography: { display: string; body: string };
}

export interface ComponentHandoff {
  name: string;
  purpose: string;
  storyBeat: string;
  props?: string[];
  children?: string[];
}

export interface CursorHandoffPackage {
  briefId: string;
  organizationId: string;
  storySentence: string;
  creativeDnaSummary: string;
  tokens: DesignTokenHandoff;
  deliverables: Array<{
    kind: ExperienceDeliverableKind;
    title: string;
    storyBeat: string;
    htmlStructure: string;
    tailwindNotes: string;
    components: ComponentHandoff[];
    layoutNotes: string;
  }>;
  standingRules: string[];
  generatedAt: string;
}

export function buildCursorHandoffPackage(brief: CreativeExperienceBrief): CursorHandoffPackage {
  const dna = brief.profile.creativeDna;
  return {
    briefId: brief.id,
    organizationId: brief.organizationId,
    storySentence: brief.profile.story.sentence,
    creativeDnaSummary: [
      dna?.emotionalTone,
      dna?.editorialStyle,
      dna?.photographyStyle,
      dna?.storyProgression,
    ]
      .filter(Boolean)
      .join(' · '),
    tokens: {
      source: '@/lib/design-system',
      primary: brief.profile.colorPalette.primary,
      secondary: brief.profile.colorPalette.secondary,
      accent: brief.profile.colorPalette.accent,
      typography: {
        display: brief.profile.typography ?? 'Barlow Condensed / editorial display',
        body: 'Humanist sans — readable, warm',
      },
    },
    deliverables: brief.deliverables.map((d) => ({
      kind: d.kind,
      title: d.title,
      storyBeat: d.storyBeat,
      htmlStructure: `Semantic sections for ${d.kind} — each section documents its story beat in a data-story-beat attribute.`,
      tailwindNotes: 'Map to EA design tokens; avoid inline NAVY/GOLD literals.',
      components: [
        {
          name: `${d.kind}-hero`,
          purpose: `Lead the ${d.kind} narrative`,
          storyBeat: d.storyBeat,
        },
      ],
      layoutNotes: `Scroll rhythm: ${dna?.scrollRhythm ?? 'cinematic chapters'}. Anti-patterns: ${dna?.antiPatterns?.slice(0, 2).join('; ') ?? 'no SaaS card grid'}.`,
    })),
    standingRules: [
      'Story before layout.',
      'Map colors to @/lib/design-system tokens.',
      'Preserve existing portal module registry patterns.',
    ],
    generatedAt: new Date().toISOString(),
  };
}

/** Markdown suitable for Cursor paste / admin copy. */
export function formatCursorHandoffMarkdown(handoff: CursorHandoffPackage): string {
  return [
    `# Open Design Handoff — ${handoff.organizationId}`,
    '',
    `Brief: \`${handoff.briefId}\``,
    `Generated: ${handoff.generatedAt}`,
    '',
    '## Story',
    '',
    handoff.storySentence,
    '',
    '## Creative DNA',
    '',
    handoff.creativeDnaSummary || '_Not set_',
    '',
    '## Design tokens',
    '',
    `- Source: \`${handoff.tokens.source}\``,
    `- Primary: ${handoff.tokens.primary}`,
    `- Secondary: ${handoff.tokens.secondary}`,
    handoff.tokens.accent ? `- Accent: ${handoff.tokens.accent}` : '',
    `- Display type: ${handoff.tokens.typography.display}`,
    `- Body type: ${handoff.tokens.typography.body}`,
    '',
    '## Deliverables',
    '',
    ...handoff.deliverables.flatMap((d) => [
      `### ${d.title} (\`${d.kind}\`)`,
      '',
      `Story beat: ${d.storyBeat}`,
      '',
      d.layoutNotes,
      '',
      d.tailwindNotes,
      '',
    ]),
    '## Standing rules',
    '',
    ...handoff.standingRules.map((r) => `- ${r}`),
    '',
  ]
    .filter(Boolean)
    .join('\n');
}
