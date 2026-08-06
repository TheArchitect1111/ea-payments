import type { CampaignContentType, FunnelStage, OrganizationStrategyPack } from './types';

export const CONVERSION_ENGINE_VERSION = 3;

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
  defaultAudience: 'People with a clear problem this organization can credibly solve',
  primaryAction: 'Take the next clear step',
  conversionUrl: '',
  contentMix: conversionMix,
  voiceRules: [
    'Sound like a knowledgeable person, not a corporate brochure',
    'Open with a specific observation, tension, question, or outcome',
    'Use short paragraphs and concrete language',
    'Give the reader one clear next step',
  ],
  prohibitedClaims: [
    'Never invent clients, quotes, results, statistics, credentials, urgency, or scarcity',
    'Never promise guaranteed results',
    'Never describe an unverified story as a client success',
  ],
  proofRules: [
    'Transformation and proof posts require verified proof supplied in the campaign story',
    'When proof is unavailable, substitute a diagnostic or educational post',
  ],
  hashtags: [],
};

const ea: OrganizationStrategyPack = {
  ...universal,
  id: 'efficiency-architects',
  displayName: 'Efficiency Architects',
  aliases: ['ea', 'efficiency architects', 'efficiencyarchitects'],
  defaultAudience: 'Business and nonprofit leaders, entrepreneurs, professionals, coaches, and creators whose growth is being limited by unclear systems or a weak digital presence',
  primaryAction: 'Complete the free Consider the Possibilities™ assessment',
  conversionUrl: 'https://cc.efficiencyarchitects.online/ctp',
  voiceRules: [
    ...universal.voiceRules,
    'Lead with the lived business problem before naming a service',
    'Describe what becomes easier, clearer, faster, or more possible',
    'Avoid automation jargon and empty growth language',
  ],
  prohibitedClaims: [
    ...universal.prohibitedClaims,
    'Do not claim an assessment diagnoses a business or guarantees growth',
  ],
  hashtags: ['EfficiencyArchitects', 'ConsiderThePossibilities', 'BusinessGrowth'],
};

const cpr: OrganizationStrategyPack = {
  ...universal,
  id: 'cpr',
  displayName: 'CPR',
  aliases: ['cpr', 'complete player recruiting', 'complete player'],
  defaultAudience: 'Student-athletes, their parents, and coaches navigating development, exposure, and recruiting',
  primaryAction: 'Start the next verified CPR step',
  conversionUrl: '',
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
  prohibitedClaims: [
    ...universal.prohibitedClaims,
    'Never guarantee recruitment, roster placement, scholarships, offers, playing time, or exposure',
    'Never invent or embellish athlete stats, rankings, interest, offers, or coach contact',
    'Never expose private information about a minor',
  ],
  proofRules: [
    'Athlete names, images, videos, statistics, offers, and quotes require confirmed athlete or parent permission',
    'Only use recruiting facts and results explicitly supplied and verified',
    'When consent or proof is missing, generate education, diagnostics, or a general invitation instead',
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
