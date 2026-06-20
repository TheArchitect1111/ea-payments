import type { ScrapedPage } from './firecrawl';
import type { ResourceClassification } from './resource-radar';
import type { OpportunityScores } from './opportunity-engine';

export type TrustConfidenceLabel = 'High' | 'Medium' | 'Low';

export interface TrustSource {
  label: string;
  url?: string;
  type: 'scrape' | 'classification' | 'keyword' | 'pattern' | 'score';
}

export interface TrustMetadata {
  confidence: number;
  confidenceLabel: TrustConfidenceLabel;
  sources: TrustSource[];
  reasoning: string[];
  method: string;
}

function confidenceLabel(score: number): TrustConfidenceLabel {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

export function buildTrustMetadata(
  page: ScrapedPage,
  classification: ResourceClassification,
  scores: OpportunityScores,
  url: string
): TrustMetadata {
  const sources: TrustSource[] = [
    { label: page.title || url, url, type: 'scrape' },
    { label: `Scraped via ${page.source}`, type: 'scrape' },
    {
      label: `${classification.category} · ${classification.industry}`,
      type: 'classification',
    },
    {
      label: `Product alignment: ${classification.productAlignment.join(', ')}`,
      type: 'keyword',
    },
    {
      label: `EA Fit ${scores.eaFitScore}/100 · Opportunity ${scores.opportunityScore}/100`,
      type: 'score',
    },
  ];

  const reasoning: string[] = [
    `Page content analyzed from ${page.source} extraction.`,
    `Classified as ${classification.category} in ${classification.industry}.`,
    `Primary function: ${classification.primaryFunction}.`,
    `Build vs buy: ${classification.buildVsBuy} · Complexity: ${classification.implementationComplexity}.`,
    `Opportunity priority: ${scores.priority} based on weighted dimension scores.`,
  ];

  const contentLength = page.markdown.length;
  let confidence = 55;
  if (page.title && page.description) confidence += 10;
  if (contentLength > 500) confidence += 10;
  if (contentLength > 2000) confidence += 8;
  if (classification.productAlignment.length >= 2) confidence += 7;
  if (page.source === 'firecrawl') confidence += 10;
  if (classification.category === 'Unknown') confidence -= 15;

  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  return {
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    sources,
    reasoning,
    method: 'Rule-based classification + keyword scoring (Wave 3 Trust Layer)',
  };
}

export function formatTrustSummary(trust: TrustMetadata): string {
  return [
    `Confidence: ${trust.confidence}/100 (${trust.confidenceLabel})`,
    `Method: ${trust.method}`,
    `Sources: ${trust.sources.map((s) => s.label).join(' · ')}`,
    `Why: ${trust.reasoning.join(' ')}`,
  ].join('\n');
}
