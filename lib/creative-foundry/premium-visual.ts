import { getEnabledCreativeProviders } from './provider-registry';
import type { CreativeBrief, CreativeSpecification } from './types';

export type PremiumVisualMode =
  | 'editorial-photo'
  | 'cinematic-lifestyle'
  | 'documentary'
  | 'bold-editorial'
  | 'product-detail'
  | 'education-carousel'
  | 'proof-story'
  | 'conversion';

export interface PremiumVisualScore {
  conceptStrength: number;
  originality: number;
  brandSpecificity: number;
  visualImpact: number;
  composition: number;
  typography: number;
  realism: number;
  platformFit: number;
  technicalQuality: number;
  payForIt: number;
  overall: number;
}

export interface PremiumVisualGate {
  passed: boolean;
  threshold: number;
  score: PremiumVisualScore;
  violations: string[];
  repairs: string[];
}

export interface PremiumVisualPlan {
  mode: PremiumVisualMode;
  direction: string;
  imageCandidates: number;
  autoRepairPasses: number;
  requiresImageGeneration: boolean;
  generationProvider?: string;
  enhancementProvider?: string;
  qualityProvider?: string;
  hardRules: string[];
}

const clamp = (n: number) => Math.max(0, Math.min(10, Number.isFinite(n) ? n : 0));
const average = (values: number[]) => Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;

export function choosePremiumVisualMode(brief: CreativeBrief, spec: CreativeSpecification): PremiumVisualMode {
  const text = `${brief.objective} ${brief.message} ${spec.visualDirection} ${spec.layoutFamily}`.toLowerCase();
  if (spec.format === 'carousel' || /teach|explain|steps|guide|tips|education/.test(text)) return 'education-carousel';
  if (/testimonial|proof|case study|transformation|before|after|story/.test(text)) return 'proof-story';
  if (/product|menu|dish|package|merch|item|detail/.test(text)) return 'product-detail';
  if (/book|register|buy|order|apply|donate|reserve|conversion|offer/.test(text)) return 'conversion';
  if (/community|real moment|behind the scenes|documentary|event|people/.test(text)) return 'documentary';
  if (/cinematic|lifestyle|emotion|aspirational|experience/.test(text)) return 'cinematic-lifestyle';
  if (spec.sourceKind === 'graphic-only') return 'bold-editorial';
  return 'editorial-photo';
}

function provider(kind: string) {
  return getEnabledCreativeProviders().find((p) => p.kind === kind);
}

export function buildPremiumVisualPlan(brief: CreativeBrief, spec: CreativeSpecification): PremiumVisualPlan {
  const mode = choosePremiumVisualMode(brief, spec);
  const generator = provider('image-generation');
  const enhancer = provider('asset-enhancement');
  const critic = provider('quality-scoring');
  const requiresImageGeneration = spec.sourceKind === 'generated-image';

  const directions: Record<PremiumVisualMode, string> = {
    'editorial-photo': 'Lead with one strong photographic moment. Natural human expression, premium editorial lighting, restrained typography, generous negative space, no generic stock-photo staging.',
    'cinematic-lifestyle': 'Build an emotionally specific lifestyle scene with cinematic light, believable environment, depth, natural skin texture and a strong focal subject. Keep copy secondary to the image.',
    documentary: 'Use a real-feeling observed moment, candid body language, environmental context and documentary composition. Avoid posed corporate imagery and fake celebration gestures.',
    'bold-editorial': 'Use one sharp idea, disciplined typography, asymmetric hierarchy and deliberate whitespace. No template-like gradients, decorative clutter or generic motivational-card styling.',
    'product-detail': 'Make the product or service detail tactile and desirable. Use controlled light, close detail, real materials and minimal sales copy.',
    'education-carousel': 'Treat the carousel as a designed editorial story: hook, visual explanation, evidence/context, takeaway and action. Each frame has a distinct job but one art direction.',
    'proof-story': 'Show believable evidence or story context without inventing claims. Lead with a human or real-world moment and let typography support the proof.',
    conversion: 'Make the desired action visually obvious without looking like a coupon template. Use a premium hero visual, clear benefit hierarchy and one decisive CTA.',
  };

  return {
    mode,
    direction: directions[mode],
    imageCandidates: requiresImageGeneration ? 4 : 2,
    autoRepairPasses: 2,
    requiresImageGeneration,
    generationProvider: generator?.provider,
    enhancementProvider: enhancer?.provider,
    qualityProvider: critic?.provider,
    hardRules: [
      'No malformed hands, faces, text or logos.',
      'No generic stock-photo posing when a real-world scene is appropriate.',
      'No unreadable type, clipped headlines or mobile overflow.',
      'No invented customer, product or performance evidence.',
      'No visible AI artifacts or implausible anatomy in approval-ready work.',
      'The visual must feel specific to this brand and message, not interchangeable with another business.',
    ],
  };
}

export function assertPremiumVisualProviderReadiness(plan: PremiumVisualPlan) {
  if (plan.requiresImageGeneration && !plan.generationProvider) {
    throw new Error('Premium visual production requires an enabled commercial-safe image-generation provider. Refusing to substitute a generic placeholder.');
  }
  if (!plan.qualityProvider) {
    throw new Error('Premium visual production requires an enabled quality-scoring provider before approval-ready output can be produced.');
  }
}

export function evaluatePremiumVisual(input: Omit<PremiumVisualScore, 'overall'>, threshold = 8.5): PremiumVisualGate {
  const clean = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, clamp(value)])) as Omit<PremiumVisualScore, 'overall'>;
  const overall = average(Object.values(clean));
  const score: PremiumVisualScore = { ...clean, overall };
  const violations: string[] = [];
  const repairs: string[] = [];

  if (score.originality < 8) { violations.push('originality-below-premium'); repairs.push('Replace the familiar visual trope with a more specific concept tied to the brand, audience or moment.'); }
  if (score.brandSpecificity < 8) { violations.push('brand-specificity-below-premium'); repairs.push('Add unmistakable brand context, environment, product, audience or visual language.'); }
  if (score.visualImpact < 8) { violations.push('stop-power-below-premium'); repairs.push('Strengthen the focal image, crop, contrast or visual tension before adding more copy.'); }
  if (score.typography < 8) { violations.push('typography-below-premium'); repairs.push('Reduce copy, improve hierarchy, spacing and mobile legibility.'); }
  if (score.realism < 8) { violations.push('realism-below-premium'); repairs.push('Repair anatomy, faces, hands, lighting, materials, logos and implausible details.'); }
  if (score.technicalQuality < 8.5) { violations.push('technical-quality-below-premium'); repairs.push('Repair resolution, compression, edge quality, crop and rendering defects.'); }
  if (score.payForIt < 8.5) { violations.push('pay-for-it-below-premium'); repairs.push('Re-art-direct the piece until it looks professionally commissioned rather than merely generated.'); }
  if (overall < threshold) violations.push('overall-below-premium-threshold');

  return { passed: violations.length === 0, threshold, score, violations, repairs };
}

export function shouldAutoRepairVisual(result: PremiumVisualGate) {
  return !result.passed;
}
