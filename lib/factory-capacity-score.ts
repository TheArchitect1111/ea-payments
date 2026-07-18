/**
 * Capacity scorecard for Factory Concept Pack — reuses Simplifi business analysis.
 */
import type { ScrapedPage } from '@/lib/firecrawl';
import type { FactoryProject } from '@/lib/factory-project-store';
import {
  analyzeBusinessOpportunity,
  type OpportunityAnalysis,
  type SimplifiBusinessScores,
} from '@/lib/simplifi-business-analysis';
import {
  classifyResource,
  computeEaFitScore,
  type ResourceClassification,
} from '@/lib/resource-radar';

export type FactoryCapacityBreakdownLine = {
  label: string;
  annualLow: number;
  annualHigh: number;
  why: string;
};

export type FactoryCapacityScorecard = {
  overallScore: number;
  benchmark: number;
  scores: SimplifiBusinessScores;
  capacityLost: {
    annualLow: number;
    annualHigh: number;
    headline: string;
    breakdown: FactoryCapacityBreakdownLine[];
  };
  opportunityGained: {
    annualLow: number;
    annualHigh: number;
    headline: string;
    assumption: string;
  };
  strengths: string[];
  gaps: string[];
};

const BENCHMARK = 72;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function artifactText(project: FactoryProject): { title: string; description?: string; markdown: string; url: string } {
  const artifacts = project.context?.artifacts || [];
  const website = [...artifacts].reverse().find((a) => a.kind === 'website');
  const extracted = asRecord(asRecord(website?.data)?.extracted) || {};
  const title = str(extracted.title) || str(extracted.ogTitle) || project.client;
  const description = str(extracted.description) || project.notes?.slice(0, 280);

  const chunks: string[] = [
    project.client,
    project.goal,
    project.deliverable,
    project.notes || '',
    title,
    description || '',
  ];

  for (const art of artifacts) {
    const data = art.data || {};
    chunks.push(JSON.stringify(data).slice(0, 1200));
  }

  return {
    title,
    description,
    markdown: chunks.join('\n').slice(0, 8000),
    url: project.url || str(asRecord(website?.data)?.url) || `https://example.com/${project.id}`,
  };
}

function dimensionGapShare(scores: SimplifiBusinessScores): Array<{ key: keyof SimplifiBusinessScores; label: string; gap: number }> {
  const rows: Array<{ key: keyof SimplifiBusinessScores; label: string; gap: number }> = [
    { key: 'visibility', label: 'Visibility / clarity of offer', gap: Math.max(0, BENCHMARK - scores.visibility) },
    { key: 'exposure', label: 'Discoverability / reach', gap: Math.max(0, BENCHMARK - scores.exposure) },
    { key: 'conversion', label: 'Conversion / next-step friction', gap: Math.max(0, BENCHMARK - scores.conversion) },
    { key: 'differentiation', label: 'Differentiation vs alternatives', gap: Math.max(0, BENCHMARK - scores.differentiation) },
    { key: 'modernity', label: 'Modern experience / digital fit', gap: Math.max(0, BENCHMARK - scores.modernity) },
    { key: 'trust', label: 'Trust / proof near the ask', gap: Math.max(0, BENCHMARK - scores.trust) },
  ];
  return rows.sort((a, b) => b.gap - a.gap);
}

export function buildFactoryCapacityScorecard(project: FactoryProject): FactoryCapacityScorecard {
  const text = artifactText(project);
  const page: ScrapedPage = {
    url: text.url,
    title: text.title,
    description: text.description,
    markdown: text.markdown,
    metadata: {},
    source: 'fallback',
  };

  let classification: ResourceClassification;
  try {
    classification = classifyResource(page.url.startsWith('http') ? page.url : `https://${page.url}`, page);
  } catch {
    classification = {
      captureType: 'Resource',
      category: 'Business',
      industry: project.industry || 'General',
      primaryFunction: project.goal,
      useCases: [project.deliverable],
      productAlignment: ['Simplifi', 'Mission Control'],
      buildVsBuy: 'Evaluate',
      implementationComplexity: 'Medium',
      innovationScore: 50,
      implementationScore: 50,
      strategicValueScore: 55,
    };
  }

  const eaFit = computeEaFitScore(classification, page);
  const analysis: OpportunityAnalysis = analyzeBusinessOpportunity(
    page,
    classification,
    eaFit,
    project.attachments?.some((a) => a.type === 'image') ? 'image/jpeg' : undefined,
  );

  const avg =
    Object.values(analysis.scores).reduce((sum, n) => sum + n, 0) / Object.keys(analysis.scores).length;
  const overallScore = Math.max(1, Math.min(100, Math.round(avg)));

  const lostLow = analysis.estimates.revenueLeftOnTable.low;
  const lostHigh = analysis.estimates.revenueLeftOnTable.high;
  // Opportunity gained ≈ reclaiming a substantial share of capacity left on the table.
  const gainedLow = Math.round(lostLow * 0.55);
  const gainedHigh = Math.round(lostHigh * 0.85);

  const gaps = dimensionGapShare(analysis.scores);
  const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0) || 1;
  const breakdown: FactoryCapacityBreakdownLine[] = gaps
    .filter((g) => g.gap > 0)
    .slice(0, 4)
    .map((g) => {
      const share = g.gap / totalGap;
      return {
        label: g.label,
        annualLow: Math.round(lostLow * share),
        annualHigh: Math.round(lostHigh * share),
        why: `Score ${analysis.scores[g.key]}/100 vs benchmark ~${BENCHMARK}/100.`,
      };
    });

  // If all scores are strong, still show a small residual line.
  if (!breakdown.length) {
    breakdown.push({
      label: 'Optimization headroom',
      annualLow: Math.max(2000, lostLow),
      annualHigh: Math.max(8000, lostHigh),
      why: 'Even strong digital systems leave conversion and follow-up capacity on the table.',
    });
  }

  const gapsList = [
    ...analysis.weaknesses,
    ...analysis.missedOpportunities,
    ...analysis.messagingGaps,
    ...analysis.visualGaps,
  ].slice(0, 6);

  return {
    overallScore,
    benchmark: BENCHMARK,
    scores: analysis.scores,
    capacityLost: {
      annualLow: lostLow,
      annualHigh: lostHigh,
      headline: `Estimated capacity left on the table: $${lostLow.toLocaleString()}–$${lostHigh.toLocaleString()} / year`,
      breakdown,
    },
    opportunityGained: {
      annualLow: gainedLow,
      annualHigh: gainedHigh,
      headline: `Potential opportunity gained with EA system: $${gainedLow.toLocaleString()}–$${gainedHigh.toLocaleString()} / year`,
      assumption: analysis.estimates.revenueLeftOnTable.assumption,
    },
    strengths: analysis.strengths.slice(0, 4),
    gaps: gapsList,
  };
}

export function formatUsdRange(low: number, high: number): string {
  return `$${low.toLocaleString()}–$${high.toLocaleString()}`;
}
