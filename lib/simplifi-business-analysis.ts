import type { ResourceClassification } from './resource-radar';
import type { ScrapedPage } from './firecrawl';

export interface SimplifiBusinessScores {
  visibility: number;
  exposure: number;
  conversion: number;
  differentiation: number;
  modernity: number;
  trust: number;
}

export interface BusinessExtraction {
  businessName?: string;
  eventName?: string;
  contactInfo?: string;
  website?: string;
  industry?: string;
  location?: string;
  cta?: string;
  audience?: string;
  visualElements: string[];
  messaging?: string;
  uploadType?: string;
}

export interface RevenueEstimate {
  low: number;
  high: number;
  assumption: string;
}

export interface OpportunityAnalysis {
  scores: SimplifiBusinessScores;
  strengths: string[];
  weaknesses: string[];
  missedOpportunities: string[];
  competitiveRisks: string[];
  messagingGaps: string[];
  visualGaps: string[];
  estimates: {
    revenueLeftOnTable: RevenueEstimate;
    leadsMissed: RevenueEstimate;
    engagementLoss: RevenueEstimate;
  };
}

function clamp(n: number): number {
  return Math.max(1, Math.min(100, Math.round(n)));
}

function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((n, kw) => (lower.includes(kw) ? n + 1 : n), 0);
}

function extractEmail(text: string): string | undefined {
  const match = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  return match?.[0];
}

function extractPhone(text: string): string | undefined {
  const match = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return match?.[0];
}

export function extractBusinessSignals(
  page: ScrapedPage,
  classification: ResourceClassification,
  uploadType?: string,
): BusinessExtraction {
  const blob = `${page.title} ${page.description ?? ''} ${page.markdown}`.slice(0, 8000);
  const meta = page.metadata ?? {};

  const businessName =
    meta.ogSiteName ||
    meta.siteName ||
    page.title.split(/[|\-–—·]/)[0]?.trim() ||
    page.title;

  const ctaHits = ['book', 'register', 'sign up', 'get started', 'contact', 'schedule', 'buy', 'join'];
  const foundCta = ctaHits.find((c) => blob.toLowerCase().includes(c));

  return {
    businessName,
    eventName: blob.match(/(?:event|conference|summit|gala|workshop)[:\s]+([^\n.]{4,60})/i)?.[1]?.trim(),
    contactInfo: [extractEmail(blob), extractPhone(blob)].filter(Boolean).join(' · ') || undefined,
    website: page.url.startsWith('http') ? page.url : undefined,
    industry: classification.industry,
    location: meta.location || meta['og:locality'] || undefined,
    cta: foundCta ? foundCta.charAt(0).toUpperCase() + foundCta.slice(1) : undefined,
    audience: classification.primaryFunction || classification.category,
    visualElements: inferVisualElements(blob, uploadType),
    messaging: page.description?.slice(0, 280) || page.title,
    uploadType,
  };
}

function inferVisualElements(blob: string, uploadType?: string): string[] {
  const elements: string[] = [];
  if (uploadType?.startsWith('image/')) elements.push('Uploaded visual asset');
  if (uploadType === 'application/pdf') elements.push('PDF document');
  if (/logo|brand/i.test(blob)) elements.push('Brand identity present');
  if (/photo|image|hero/i.test(blob)) elements.push('Photography or imagery');
  if (/video|youtube|vimeo/i.test(blob)) elements.push('Video content signals');
  if (/testimonial|review|quote/i.test(blob)) elements.push('Social proof elements');
  if (elements.length === 0) elements.push('Marketing layout detected');
  return elements;
}

export function analyzeBusinessOpportunity(
  page: ScrapedPage,
  classification: ResourceClassification,
  eaFitScore: number,
  uploadType?: string,
): OpportunityAnalysis {
  const blob = `${page.title} ${page.description ?? ''} ${page.markdown}`.toLowerCase();
  const wordCount = blob.split(/\s+/).filter(Boolean).length;

  const visibility = clamp(
    countKeywords(blob, ['about', 'services', 'mission', 'who we are', 'portfolio']) * 8 +
      (wordCount > 400 ? 25 : wordCount > 150 ? 15 : 5) +
      (classification.category === 'Business' ? 15 : 8),
  );

  const exposure = clamp(
    countKeywords(blob, ['social', 'instagram', 'facebook', 'linkedin', 'newsletter', 'blog']) * 10 +
      countKeywords(blob, ['seo', 'search', 'discover', 'audience', 'reach']) * 8 +
      12,
  );

  const conversion = clamp(
    countKeywords(blob, ['book', 'schedule', 'contact', 'register', 'apply', 'buy', 'quote']) * 12 +
      (blob.includes('form') ? 15 : 0) +
      (blob.includes('call to action') || blob.includes('cta') ? 10 : 5),
  );

  const differentiation = clamp(
    countKeywords(blob, ['unique', 'only', 'first', 'proprietary', 'specialized', 'award']) * 12 +
      (classification.useCases.length > 2 ? 20 : 10) +
      (eaFitScore > 60 ? 10 : 0),
  );

  const modernity = clamp(
    countKeywords(blob, ['mobile', 'app', 'automation', 'ai', 'digital', 'modern', 'platform']) * 10 +
      (uploadType?.startsWith('image/') ? 18 : 12) +
      (blob.includes('outdated') || blob.includes('under construction') ? -15 : 0),
  );

  const trust = clamp(
    countKeywords(blob, ['testimonial', 'review', 'certified', 'licensed', 'years', 'trusted']) * 10 +
      countKeywords(blob, ['team', 'founder', 'credentials', 'case study']) * 8 +
      15,
  );

  const scores: SimplifiBusinessScores = {
    visibility,
    exposure,
    conversion,
    differentiation,
    modernity,
    trust,
  };

  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 6;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const missedOpportunities: string[] = [];
  const competitiveRisks: string[] = [];
  const messagingGaps: string[] = [];
  const visualGaps: string[] = [];

  if (visibility >= 60) strengths.push('Core offering is identifiable to a first-time visitor.');
  else weaknesses.push('Value proposition is hard to grasp within the first few seconds.');

  if (exposure >= 55) strengths.push('Signals of audience reach and distribution channels exist.');
  else missedOpportunities.push('Expand discoverability through consistent content and social proof.');

  if (conversion >= 55) strengths.push('Clear paths to take action are present.');
  else missedOpportunities.push('Add a single primary CTA above the fold with low-friction next step.');

  if (differentiation >= 55) strengths.push('Distinct positioning language separates you from generic competitors.');
  else messagingGaps.push('Sharpen what makes this offer uniquely valuable versus alternatives.');

  if (modernity >= 55) strengths.push('Presentation aligns with contemporary buyer expectations.');
  else visualGaps.push('Visual hierarchy and layout may feel dated relative to category leaders.');

  if (trust >= 55) strengths.push('Trust signals help reduce hesitation before engagement.');
  else messagingGaps.push('Add testimonials, credentials, or outcome proof closer to primary CTAs.');

  if (avg < 50) competitiveRisks.push('Competitors with stronger digital presence may capture attention first.');
  if (conversion < 45) competitiveRisks.push('Prospects may leave without engaging because the next step is unclear.');
  if (exposure < 45) competitiveRisks.push('Limited visibility reduces inbound opportunity volume over time.');

  const revenueMultiplier = (100 - avg) / 100;
  const revenueLeftOnTable: RevenueEstimate = {
    low: Math.round(12000 * revenueMultiplier),
    high: Math.round(48000 * revenueMultiplier),
    assumption: `Based on average score ${Math.round(avg)}/100 vs. category benchmark ~72/100; assumes moderate transaction value and monthly lead volume.`,
  };

  const leadsMissed: RevenueEstimate = {
    low: Math.round(8 * revenueMultiplier),
    high: Math.round(35 * revenueMultiplier),
    assumption: 'Estimated monthly leads not captured due to weak conversion paths and unclear messaging.',
  };

  const engagementLoss: RevenueEstimate = {
    low: Math.round(15 * revenueMultiplier),
    high: Math.round(45 * revenueMultiplier),
    assumption: 'Estimated percentage of visitors who disengage before understanding the offer (bounce / scroll depth proxy).',
  };

  return {
    scores,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    missedOpportunities: missedOpportunities.slice(0, 4),
    competitiveRisks: competitiveRisks.slice(0, 3),
    messagingGaps: messagingGaps.slice(0, 3),
    visualGaps: visualGaps.slice(0, 3),
    estimates: { revenueLeftOnTable, leadsMissed, engagementLoss },
  };
}

export function formatScoresLine(scores: SimplifiBusinessScores): string {
  return [
    `Visibility ${scores.visibility}/100`,
    `Exposure ${scores.exposure}/100`,
    `Conversion ${scores.conversion}/100`,
    `Differentiation ${scores.differentiation}/100`,
    `Modernity ${scores.modernity}/100`,
    `Trust ${scores.trust}/100`,
  ].join(' · ');
}
