import { createHash } from 'node:crypto';
import { mergeStoryLenses } from './archetype-lenses';
import {
  STORY_ARCHETYPES,
  type OrganizationStoryInput,
  type StoryArchetype,
  type StoryClassification,
} from './types';

type SignalRule = {
  archetype: StoryArchetype;
  patterns: RegExp[];
  weight: number;
};

const RULES: SignalRule[] = [
  {
    archetype: 'The Community Builder',
    patterns: [
      /\b(community|belong|together|club|gather|neighbors?|members?)\b/i,
      /\bafter[- ]?school\b/i,
    ],
    weight: 3,
  },
  {
    archetype: 'The Advocate',
    patterns: [
      /\b(advoca|voice|stand up|justice|unheard|dignity|rights?)\b/i,
      /\b(america needs|policy|unsupervised)\b/i,
    ],
    weight: 3,
  },
  {
    archetype: 'The Guide',
    patterns: [
      /\b(guide|walk (with|beside)|accompan|coach|mentor|clarity|journey)\b/i,
      /\b(not alone|beside you)\b/i,
    ],
    weight: 3,
  },
  {
    archetype: 'The Builder',
    patterns: [/\b(build|construct|create|launch|make|erect|develop)\b/i, /\bproject\b/i],
    weight: 2,
  },
  {
    archetype: 'The Restorer',
    patterns: [
      /\b(restor|repair|reclaim|renew|rehab|heritage|bring back)\b/i,
      /\bbefore\b.*\bafter\b/i,
    ],
    weight: 3,
  },
  {
    archetype: 'The Protector',
    patterns: [
      /\b(protect|secur|safe|guard|shield|cover|insurance|compliance)\b/i,
      /\bwatch(ed)? over\b/i,
    ],
    weight: 3,
  },
  {
    archetype: 'The Innovator',
    patterns: [/\b(innovat|invent|next[- ]gen|breakthrough|prototype|novel)\b/i],
    weight: 3,
  },
  {
    archetype: 'The Challenger',
    patterns: [/\b(challeng|status quo|disrupt|refuse|confront|against)\b/i],
    weight: 3,
  },
  {
    archetype: 'The Legacy Organization',
    patterns: [/\b(legacy|tradition|since \d{4}|generations?|heritage|endur)/i],
    weight: 3,
  },
  {
    archetype: 'The Educator',
    patterns: [/\b(educat|teach|learn|curriculum|mastery|train|course|school)\b/i],
    weight: 2.5,
  },
  {
    archetype: 'The Caregiver',
    patterns: [/\b(care|nurtur|heal|compassion|tend|wellness|patient)\b/i],
    weight: 3,
  },
  {
    archetype: 'The Craftsman',
    patterns: [
      /\b(craft|handmade|bespoke|mastery|artisan|custom|woodwork|atelier)\b/i,
      /\bmade with\b/i,
    ],
    weight: 3,
  },
];

function corpus(input: OrganizationStoryInput): string {
  return [
    input.organizationName,
    input.industry,
    input.primaryAudience,
    input.whoTheyAre,
    input.mission,
    input.story,
    input.whyTheyExist,
    input.whoTheyHelp,
    input.whyItMatters,
    input.whatChanges,
    input.brandHeadline,
    input.brandSubhead,
    input.brandVoice,
    ...(input.differentiators || []),
  ]
    .filter(Boolean)
    .join('\n');
}

function scoreArchetypes(text: string): Map<StoryArchetype, number> {
  const scores = new Map<StoryArchetype, number>();
  for (const archetype of STORY_ARCHETYPES) scores.set(archetype, 0);

  for (const rule of RULES) {
    let hits = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) hits += 1;
    }
    if (hits > 0) {
      scores.set(rule.archetype, (scores.get(rule.archetype) || 0) + rule.weight * hits);
    }
  }

  // Industry weak boosts
  if (/\byouth|nonprofit|club\b/i.test(text)) {
    scores.set('The Community Builder', (scores.get('The Community Builder') || 0) + 1.5);
  }
  if (/\binsurance|security|compliance\b/i.test(text)) {
    scores.set('The Protector', (scores.get('The Protector') || 0) + 1.5);
  }
  if (/\brestor|historic|heritage\b/i.test(text)) {
    scores.set('The Restorer', (scores.get('The Restorer') || 0) + 1.5);
  }
  if (/\bcoach|consult\b/i.test(text)) {
    scores.set('The Guide', (scores.get('The Guide') || 0) + 1);
  }
  if (/\bfurniture|wood|craft|atelier\b/i.test(text)) {
    scores.set('The Craftsman', (scores.get('The Craftsman') || 0) + 1.5);
  }

  return scores;
}

function normalizeBlend(
  scores: Map<StoryArchetype, number>,
): Array<{ archetype: StoryArchetype; weight: number }> {
  const ranked = [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) {
    return [{ archetype: 'The Guide', weight: 1 }];
  }

  const top = ranked.slice(0, 3);
  const total = top.reduce((sum, [, s]) => sum + s, 0) || 1;
  let blend = top
    .map(([archetype, score]) => ({
      archetype,
      weight: Math.round((score / total) * 100) / 100,
    }))
    .filter((item) => item.weight >= 0.15);

  if (blend.length === 0) {
    blend = [{ archetype: top[0][0], weight: 1 }];
  }

  const sum = blend.reduce((s, item) => s + item.weight, 0);
  blend = blend.map((item) => ({
    ...item,
    weight: Math.round((item.weight / sum) * 100) / 100,
  }));

  // Ensure sum ≈ 1
  const drift = 1 - blend.reduce((s, item) => s + item.weight, 0);
  if (blend[0]) blend[0].weight = Math.round((blend[0].weight + drift) * 100) / 100;

  return blend;
}

export function classifyOrganizationStory(input: OrganizationStoryInput): StoryClassification {
  const text = corpus(input);
  const scores = scoreArchetypes(text);
  const blend = normalizeBlend(scores);
  const primary = blend[0]?.archetype || 'The Guide';
  const topScore = scores.get(primary) || 0;
  const confidence = Math.min(95, Math.round(40 + topScore * 8 + Math.min(text.length, 400) / 20));

  const storyLens = mergeStoryLenses(blend);
  const rejected = STORY_ARCHETYPES.filter(
    (archetype) => !blend.some((item) => item.archetype === archetype) && (scores.get(archetype) || 0) < 1,
  ).slice(0, 4);

  const classificationId = `sc-${createHash('sha1')
    .update(`${input.organizationName}|${primary}|${blend.map((b) => `${b.archetype}:${b.weight}`).join(',')}`)
    .digest('hex')
    .slice(0, 12)}`;

  const rationale = [
    `Primary archetype ${primary} from story signals (services are weak signal).`,
    ...blend.slice(0, 2).map(
      (item) => `${Math.round(item.weight * 100)}% ${item.archetype}`,
    ),
    input.whoTheyAre
      ? `Identity: ${input.whoTheyAre.slice(0, 120)}`
      : 'Thin identity — Guide-leaning defaults applied until story deepens.',
  ];

  return {
    classificationId,
    primaryArchetype: primary,
    blend,
    confidence,
    rationale,
    rejectedArchetypes: rejected as StoryArchetype[],
    storyLens,
  };
}
