import type { CampaignContentType, FunnelStage, OrganizationStrategyPack } from './types';

export const CONVERSION_ENGINE_VERSION = 5;

const conversionMix: Array<{ contentType: CampaignContentType; funnelStage: FunnelStage }> = [
  { contentType: 'problem-recognition', funnelStage: 'attract' },
  { contentType: 'diagnostic', funnelStage: 'help' },
  { contentType: 'expert-video', funnelStage: 'trust' },
  { contentType: 'before-after', funnelStage: 'trust' },
  { contentType: 'objection-answer', funnelStage: 'help' },
  { contentType: 'direct-invitation', funnelStage: 'convert' },
  { contentType: 'client-transformation', funnelStage: 'trust' },
  { contentType: 'proof', funnelStage: 'convert' },
];

const universal: OrganizationStrategyPack = {
  id: 'universal',
  displayName: 'Universal conversion',
  aliases: [],
  defaultAudience: 'People who may benefit from what this organization provides',
  primaryAction: 'Take the next clear step',
  conversionUrl: '',
  contentMix: conversionMix,
  posture: 'A knowledgeable, human guide',
  narrativeArc: ['Create recognition', 'Show a meaningful possibility', 'Offer useful guidance', 'Invite one clear next step'],
  voiceRules: [
    'Sound like a thoughtful person, not a corporate brochure',
    'Open with a specific observation, question, moment, or desired outcome',
    'Use short paragraphs and everyday language',
    'Make the reader feel understood before presenting an action',
  ],
  prohibitedLanguage: ['leverage', 'optimize', 'digital transformation', 'qualified leads'],
  prohibitedClaims: [
    'Never invent clients, quotes, results, statistics, credentials, urgency, or scarcity',
    'Never promise guaranteed results',
    'Never describe an unverified story as a client success',
  ],
  proofRules: [
    'Transformation and proof posts require verified proof supplied in the campaign story',
    'When proof is unavailable, substitute a helpful educational or recognition post',
  ],
  criticQuestions: [
    'Does this sound human and specific?',
    'Does this give the reader something useful?',
    'Is the next step clear and pressure-free?',
  ],
  hashtags: [],
};

const ea: OrganizationStrategyPack = {
  ...universal,
  id: 'efficiency-architects',
  displayName: 'Efficiency Architects',
  aliases: ['ea', 'efficiency architects', 'efficiencyarchitects'],
  defaultAudience: 'People building a business, organization, program, or personal brand who sense that something could feel clearer, easier, or more aligned with where they are going',
  primaryAction: 'Explore Consider the Possibilities™',
  conversionUrl: 'https://cc.efficiencyarchitects.online/ctp',
  posture: 'A warm, experienced guide—never a consultant, auditor, diagnostician, agency, or technical vendor',
  narrativeArc: [
    'Reflect what life or work may feel like now without judging the reader',
    'Help the reader imagine what could become easier, clearer, or more possible',
    'Offer one gentle, useful way to look at the situation',
    'Invite the reader to explore Consider the Possibilities™ without pressure',
  ],
  voiceRules: [
    'Write with warmth, curiosity, dignity, and emotional intelligence',
    'Begin with lived experience, not a business category, service, or diagnosis',
    'Use ordinary language that requires no business or technology knowledge',
    'Create recognition without telling the reader what is wrong with them',
    'Describe possibilities and desired experiences instead of selling solutions',
    'Let the invitation feel like a natural continuation of the story',
    'Use guide language: notice, explore, imagine, consider, begin, and discover',
  ],
  prohibitedLanguage: [
    'operational gaps',
    'qualified leads',
    'qualified business leads',
    'diagnose',
    'diagnostic',
    'consultation',
    'consultant',
    'optimize',
    'optimization',
    'leverage',
    'business-growth systems',
    'improve your operations',
    'digital transformation',
    'identify what is wrong',
    'pain points',
    'efficiency audit',
    'sales funnel',
  ],
  prohibitedClaims: [
    ...universal.prohibitedClaims,
    'Do not present Consider the Possibilities™ as an evaluation, diagnosis, audit, score, or promise of growth',
    'Do not position Efficiency Architects as fixing, correcting, or rescuing the reader',
  ],
  proofRules: [
    ...universal.proofRules,
    'Use a verified story to illuminate a possibility, never to pressure the reader with comparison',
  ],
  criticQuestions: [
    'Does this unmistakably sound like a guide rather than a consultant?',
    'Does it create recognition without criticizing or diagnosing the reader?',
    'Does it help the reader imagine a better lived experience?',
    'Could someone without business or technology knowledge understand it immediately?',
    'Does the invitation feel natural, warm, and pressure-free?',
    'Is every sentence free of consultant, agency, and technical-vendor language?',
  ],
  hashtags: ['EfficiencyArchitects', 'ConsiderThePossibilities'],
};

const cpr: OrganizationStrategyPack = {
  ...universal,
  id: 'cpr',
  displayName: 'CPR',
  aliases: ['cpr', 'complete player recruiting', 'complete player'],
  defaultAudience: 'Student-athletes, their parents, and coaches navigating development, exposure, and recruiting',
  primaryAction: 'Start the next verified CPR step',
  conversionUrl: '',
  posture: 'A clear, responsible guide for athletes and families',
  narrativeArc: ['Recognize the family experience', 'Offer useful recruiting guidance', 'Build trust with verified information', 'Invite a practical next step'],
  contentMix: [
    { contentType: 'problem-recognition', funnelStage: 'attract' },
    { contentType: 'diagnostic', funnelStage: 'help' },
    { contentType: 'expert-video', funnelStage: 'trust' },
    { contentType: 'objection-answer', funnelStage: 'help' },
    { contentType: 'direct-invitation', funnelStage: 'convert' },
    { contentType: 'client-transformation', funnelStage: 'trust' },
    { contentType: 'proof', funnelStage: 'convert' },
  ],
  voiceRules: [
    ...universal.voiceRules,
    'Speak clearly to athletes and parents without hype or recruiting jargon',
    'Make the next action practical and age-appropriate',
    'Protect the dignity and privacy of every athlete',
  ],
  prohibitedLanguage: [...universal.prohibitedLanguage, 'guaranteed scholarship', 'guaranteed exposure'],
  prohibitedClaims: [
    ...universal.prohibitedClaims,
    'Never guarantee recruitment, roster placement, scholarships, offers, playing time, or exposure',
    'Never invent or embellish athlete stats, rankings, interest, offers, or coach contact',
    'Never expose private information about a minor',
  ],
  proofRules: [
    'Athlete names, images, videos, statistics, offers, and quotes require confirmed athlete or parent permission',
    'Only use recruiting facts and results explicitly supplied and verified',
    'When consent or proof is missing, generate education, guidance, or a general invitation instead',
  ],
  criticQuestions: [
    ...universal.criticQuestions,
    'Does this protect the dignity and privacy of the athlete?',
    'Is every recruiting claim verified and free of guarantees?',
  ],
  hashtags: ['CPR', 'StudentAthlete', 'RecruitingEducation'],
};

export const STRATEGY_PACKS: Record<string, OrganizationStrategyPack> = {
  universal,
  'efficiency-architects': ea,
  cpr,
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function getStrategyPack(organizationId: string, organizationName?: string): OrganizationStrategyPack {
  const candidates = [organizationId, organizationName ?? ''].map(normalize).filter(Boolean);
  for (const pack of Object.values(STRATEGY_PACKS)) {
    const names = [pack.id, pack.displayName, ...pack.aliases].map(normalize);
    if (candidates.some((candidate) => names.includes(candidate) || names.some((name) => candidate.includes(name)))) {
      return pack;
    }
  }
  return universal;
}

export function selectConversionPlan(pack: OrganizationStrategyPack, days: number, hasVerifiedProof: boolean) {
  const safeMix = pack.contentMix.filter(({ contentType }) =>
    hasVerifiedProof || (contentType !== 'client-transformation' && contentType !== 'proof'),
  );
  const fallback = safeMix.length ? safeMix : universal.contentMix.slice(0, 1);
  return Array.from({ length: days }, (_, index) => ({
    dayOffset: index,
    ...fallback[index % fallback.length],
  }));
}
