import type { NarrativeSceneRole, StoryArchetype, StoryLens } from './types';

const baseAvoid = [
  'generic three-equal feature-card grids',
  'saas dashboard chrome',
  'hero-about-features-cta starter stack',
];

export const ARCHETYPE_LENSES: Record<StoryArchetype, StoryLens> = {
  'The Guide': {
    primaryEmotionalOutcome: 'Calm confidence — I am not alone',
    visualLanguage: 'Open paths, horizons, quiet authority',
    photographyStyle: 'Companion moments; walking beside; soft natural light',
    narrativePacing: 'Steady reveal; low urgency',
    typographyPersonality: 'Warm display + clear body; generous leading',
    motionPhilosophy: 'Slow fades; scroll as accompaniment',
    colorPersonality: 'Restrained neutrals; one warm accent',
    ctaPhilosophy: 'Invitation to a conversation, not a hard close',
    proofStrategy: 'Stories of people guided — not feature lists',
    preferredSceneOrder: ['human_story', 'mission', 'transformation', 'process', 'invitation'],
    avoidedDesignPatterns: [...baseAvoid, 'countdown urgency', 'aggressive contrast bars'],
  },
  'The Builder': {
    primaryEmotionalOutcome: 'Momentum — something real is being made',
    visualLanguage: 'Structure, materials, progress in frame',
    photographyStyle: 'Hands at work; sites; unfinished to finished honesty',
    narrativePacing: 'Forward drive; clear milestones',
    typographyPersonality: 'Strong geometric display; tight headlines',
    motionPhilosophy: 'Directional entrances; build-up reveals',
    colorPersonality: 'Industrial clarity; bold primary',
    ctaPhilosophy: 'Start the project / see the plan',
    proofStrategy: 'Built work, timelines kept, tangible outcomes',
    preferredSceneOrder: ['mission', 'transformation', 'process', 'impact', 'invitation'],
    avoidedDesignPatterns: [...baseAvoid, 'vague solutions grids', 'soft lifestyle fluff'],
  },
  'The Restorer': {
    primaryEmotionalOutcome: 'Relief — this can be whole again',
    visualLanguage: 'Before/after restraint; care for detail',
    photographyStyle: 'Weathered textures; careful repair; respectful close-ups',
    narrativePacing: 'Patient; honor what was',
    typographyPersonality: 'Classic display; dignified spacing',
    motionPhilosophy: 'Gentle dissolves; no flashy wipes',
    colorPersonality: 'Patina neutrals; deep accent',
    ctaPhilosophy: 'Restore / reclaim / begin recovery',
    proofStrategy: 'Transformations with context — never shame the past',
    preferredSceneOrder: [
      'current_reality',
      'mission',
      'transformation',
      'proof',
      'invitation',
    ],
    avoidedDesignPatterns: [...baseAvoid, 'hyper-modern saas chrome', 'disrupt language'],
  },
  'The Protector': {
    primaryEmotionalOutcome: 'Safety — we are watched over',
    visualLanguage: 'Stability, boundaries, quiet strength',
    photographyStyle: 'Solid environments; attentive presence; low drama',
    narrativePacing: 'Measured; trust before ask',
    typographyPersonality: 'Solid sans or sturdy serif; high clarity',
    motionPhilosophy: 'Minimal; confidence over spectacle',
    colorPersonality: 'Deep, stable bases; limited accents',
    ctaPhilosophy: 'Protect / secure / get covered',
    proofStrategy: 'Credentials, standards, stewardship stories',
    preferredSceneOrder: ['mission', 'proof', 'process', 'human_story', 'invitation'],
    avoidedDesignPatterns: [...baseAvoid, 'playful chaos', 'fear-mongering stock'],
  },
  'The Innovator': {
    primaryEmotionalOutcome: 'Possibility — the future is open',
    visualLanguage: 'Light, negative space, precise novelty',
    photographyStyle: 'Clean tools; abstract light; people inventing',
    narrativePacing: 'Curious leaps; then grounding',
    typographyPersonality: 'Modern display; sharp hierarchy',
    motionPhilosophy: 'Precise micro-motion',
    colorPersonality: 'High-contrast clarity; one electric accent max',
    ctaPhilosophy: 'See what is next / explore the new',
    proofStrategy: 'Working prototypes, firsts — real only',
    preferredSceneOrder: ['mission', 'transformation', 'impact', 'proof', 'invitation'],
    avoidedDesignPatterns: [...baseAvoid, 'retro clutter', 'ai circuit cliches'],
  },
  'The Challenger': {
    primaryEmotionalOutcome: 'Courage — someone is finally saying it',
    visualLanguage: 'Tension, bold crop, interruption of norms',
    photographyStyle: 'Confrontational honesty; documentary',
    narrativePacing: 'Punch then proof then path',
    typographyPersonality: 'Heavy display; short lines',
    motionPhilosophy: 'Sharp cuts; intentional friction',
    colorPersonality: 'High contrast; sparse palette',
    ctaPhilosophy: 'Join the stand / change the game',
    proofStrategy: 'Outcomes against the old way',
    preferredSceneOrder: [
      'current_reality',
      'mission',
      'transformation',
      'proof',
      'invitation',
    ],
    avoidedDesignPatterns: [...baseAvoid, 'corporate soft-sell', 'polite feature grids'],
  },
  'The Community Builder': {
    primaryEmotionalOutcome: 'Belonging — I have a place here',
    visualLanguage: 'Groups, circles, shared tables',
    photographyStyle: 'Many faces; gatherings; warm ambient light',
    narrativePacing: 'Inclusive; chorus of voices',
    typographyPersonality: 'Friendly display; open tracking',
    motionPhilosophy: 'Soft collective reveals',
    colorPersonality: 'Warm, welcoming; avoid cold tech blue',
    ctaPhilosophy: 'Join us / come to the table',
    proofStrategy: 'Member stories; community moments',
    preferredSceneOrder: ['human_story', 'mission', 'impact', 'proof', 'invitation'],
    avoidedDesignPatterns: [...baseAvoid, 'lone hero ceo worship', 'exclusive luxury chill'],
  },
  'The Legacy Organization': {
    primaryEmotionalOutcome: 'Continuity — this endures',
    visualLanguage: 'Heritage marks, craft of time, quiet prestige',
    photographyStyle: 'Archives, materials, multi-generation presence',
    narrativePacing: 'Slow; honor history then future',
    typographyPersonality: 'Timeless serif or refined humanist',
    motionPhilosophy: 'Almost still; cinematic dissolves',
    colorPersonality: 'Deep classics; gold as restraint',
    ctaPhilosophy: 'Continue the tradition / steward with us',
    proofStrategy: 'Longevity, stewardship, lineage',
    preferredSceneOrder: ['mission', 'human_story', 'proof', 'process', 'invitation'],
    avoidedDesignPatterns: [...baseAvoid, 'startup hype', 'trendy ui chrome'],
  },
  'The Advocate': {
    primaryEmotionalOutcome: 'Dignity — our voice matters',
    visualLanguage: 'Human focus; protest of indifference without rage clutter',
    photographyStyle: 'Portrait-led; real people; respectful framing',
    narrativePacing: 'Story first; ask second',
    typographyPersonality: 'Clear, urgent but humane',
    motionPhilosophy: 'Emphatic but not frantic',
    colorPersonality: 'Bold accent on sober ground',
    ctaPhilosophy: 'Stand with us / take action',
    proofStrategy: 'Impact on people served; policy or care wins',
    preferredSceneOrder: [
      'human_story',
      'current_reality',
      'mission',
      'impact',
      'invitation',
    ],
    avoidedDesignPatterns: [...baseAvoid, 'stock handshake diversity', 'empty slogans'],
  },
  'The Educator': {
    primaryEmotionalOutcome: 'Mastery — I can learn this',
    visualLanguage: 'Clarity, diagrams of meaning, illuminated focus',
    photographyStyle: 'Teaching moments; boards; aha faces',
    narrativePacing: 'Lesson rhythm: premise then insight then practice',
    typographyPersonality: 'Highly readable; hierarchical teaching scale',
    motionPhilosophy: 'Stepwise reveals',
    colorPersonality: 'Clean academic calm; one highlight',
    ctaPhilosophy: 'Start learning / enroll / explore curriculum',
    proofStrategy: 'Alumni outcomes; curriculum depth',
    preferredSceneOrder: ['mission', 'process', 'transformation', 'proof', 'invitation'],
    avoidedDesignPatterns: [...baseAvoid, 'mystery marketing', 'vague empowerment cards'],
  },
  'The Caregiver': {
    primaryEmotionalOutcome: 'Tenderness — I will be cared for',
    visualLanguage: 'Soft edges, human proximity, unhurried space',
    photographyStyle: 'Gentle care moments; privacy-respecting',
    narrativePacing: 'Slow; reassure often',
    typographyPersonality: 'Soft humanist; never harsh condensed',
    motionPhilosophy: 'Breathing fades; no jolt',
    colorPersonality: 'Soft grounds; healing accents',
    ctaPhilosophy: 'Talk with us / request care',
    proofStrategy: 'Testimonies of feeling safe; credentials quietly',
    preferredSceneOrder: ['human_story', 'mission', 'process', 'proof', 'invitation'],
    avoidedDesignPatterns: [...baseAvoid, 'clinical coldness', 'aggressive sales'],
  },
  'The Craftsman': {
    primaryEmotionalOutcome: 'Respect — this was made with mastery',
    visualLanguage: 'Material honesty; tool and texture',
    photographyStyle: 'Macro craft; process beauty; finished object',
    narrativePacing: 'Detail then whole then invitation',
    typographyPersonality: 'Refined, slightly austere',
    motionPhilosophy: 'Precise, rare motion',
    colorPersonality: 'Material palette; ink and wood and steel',
    ctaPhilosophy: 'Commission / view the work',
    proofStrategy: 'Portfolio depth; process integrity',
    preferredSceneOrder: ['mission', 'process', 'proof', 'human_story', 'invitation'],
    avoidedDesignPatterns: [...baseAvoid, 'generic service icons', 'fake handmade stock'],
  },
};

export function mergeStoryLenses(
  blend: Array<{ archetype: StoryArchetype; weight: number }>,
): StoryLens {
  const sorted = [...blend].sort((a, b) => b.weight - a.weight);
  const primary = ARCHETYPE_LENSES[sorted[0]?.archetype || 'The Guide'];
  const secondary = sorted[1] ? ARCHETYPE_LENSES[sorted[1].archetype] : null;

  const avoided = new Set(primary.avoidedDesignPatterns);
  if (secondary) {
    for (const pattern of secondary.avoidedDesignPatterns) avoided.add(pattern);
  }

  let order: NarrativeSceneRole[] = [...primary.preferredSceneOrder];
  if (secondary && sorted[1] && sorted[1].weight >= 0.25) {
    if (
      secondary.preferredSceneOrder.includes('current_reality') &&
      !order.includes('current_reality')
    ) {
      const humanIdx = order.indexOf('human_story');
      if (humanIdx >= 0) {
        order = [
          ...order.slice(0, humanIdx + 1),
          'current_reality',
          ...order.slice(humanIdx + 1),
        ];
      } else {
        order = ['current_reality', ...order];
      }
    }
  }

  // Cap 4–7 scenes; always end with invitation when present
  order = order.filter((role, i, arr) => arr.indexOf(role) === i).slice(0, 7);
  if (!order.includes('invitation')) order.push('invitation');

  return {
    ...primary,
    primaryEmotionalOutcome: secondary
      ? `${primary.primaryEmotionalOutcome} — with ${secondary.primaryEmotionalOutcome.split('—')[0].trim().toLowerCase()} tint`
      : primary.primaryEmotionalOutcome,
    photographyStyle: secondary
      ? `${primary.photographyStyle}; modulated by ${secondary.photographyStyle}`
      : primary.photographyStyle,
    preferredSceneOrder: order,
    avoidedDesignPatterns: [...avoided],
  };
}
