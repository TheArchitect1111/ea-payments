/** Standing design rules — enforced in Open Design pipeline and agent prompts. */

export const STANDING_DESIGN_RULES = [
  'Story before layout.',
  'Experience before sections.',
  'Emotion before information.',
  'Narrative before navigation.',
  'Identity before industry.',
  'Never create a generic corporate website.',
  'Never default to cards, boxes, or SaaS dashboards unless they serve the story.',
  'Every section must answer: What part of the story is this telling?',
] as const;

export const DEFAULT_ANTI_PATTERNS = [
  'Generic SaaS hero with floating UI mockup',
  'Three-column icon card grid as homepage',
  'Purple gradient on white — "AI startup" aesthetic',
  'Dashboard-first marketing site',
  'Stock handshake photography',
  'Meaningless "Our Values" icon row',
] as const;

export const SECTION_STORY_PROMPT = 'What part of the story is this telling?';
