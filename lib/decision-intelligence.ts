import type { ScrapedPage } from './firecrawl';
import type { ResourceClassification } from './resource-radar';
import type { OpportunityScores } from './opportunity-engine';
import type { RecommendationResult } from './recommendation-engine';

export type RecommendedPath = 'build' | 'buy' | 'overlay' | 'extend' | 'partner' | 'leave-alone';

export interface DecisionIntelligenceReport {
  coreQuestion: string;
  recommendedPath: RecommendedPath;
  pathRationale: string;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskNotes: string[];
  possibilityHighlights: string[];
  missedOpportunities: string[];
  futureStatePrompt: string;
}

export function buildDecisionIntelligence(input: {
  page: ScrapedPage;
  classification: ResourceClassification;
  scores: OpportunityScores;
  recommendations: RecommendationResult;
  businessName: string;
}): DecisionIntelligenceReport {
  const { classification, scores, recommendations, businessName } = input;
  const avgScore = scores.opportunityScore;

  let recommendedPath: RecommendedPath = 'overlay';
  let pathRationale =
    'An existing EA platform or vertical template can absorb this experience with a theme overlay — faster than greenfield.';

  if (classification.buildVsBuy === 'Buy' && scores.eaFitScore < 45) {
    recommendedPath = 'buy';
    pathRationale = 'Low EA fit and buy-leaning signals — evaluate packaged SaaS before custom build.';
  } else if (classification.implementationComplexity === 'High' && scores.eaFitScore >= 70) {
    recommendedPath = 'extend';
    pathRationale = 'High complexity with strong EA fit — extend the Simplifi platform rather than start fresh.';
  } else if (avgScore >= 75 && classification.buildVsBuy === 'Build') {
    recommendedPath = 'build';
    pathRationale = 'Strong scores and build signals — custom experience may be justified if reuse score is low.';
  } else if (scores.eaFitScore < 35) {
    recommendedPath = 'leave-alone';
    pathRationale = 'Low fit — prioritize clarity and assessment before any build investment.';
  } else if (/partner|referral|marketplace/i.test(classification.category)) {
    recommendedPath = 'partner';
    pathRationale = 'Partner or marketplace motion may outperform internal build.';
  }

  const confidenceScore = Math.min(
    95,
    Math.round((scores.eaFitScore * 0.45 + scores.opportunityScore * 0.35 + avgScore * 0.2) / 1),
  );

  const riskLevel: DecisionIntelligenceReport['riskLevel'] =
    confidenceScore >= 72 ? 'low' : confidenceScore >= 50 ? 'medium' : 'high';

  const possibilityHighlights = [
    `What becomes possible if ${businessName} captured every interested visitor automatically?`,
    `What if ${recommendations.priorities[0]?.title ?? 'the top priority'} shipped in weeks, not quarters?`,
    `What if clarity replaced chaos across ${classification.industry.toLowerCase()} operations?`,
  ];

  return {
    coreQuestion: 'What becomes possible?',
    recommendedPath,
    pathRationale,
    confidenceScore,
    riskLevel,
    riskNotes: [
      classification.implementationComplexity === 'High'
        ? 'Implementation complexity is high — scope tightly.'
        : 'Complexity is manageable with reuse-first approach.',
      scores.eaFitScore < 55 ? 'EA fit is moderate — validate ROI before build.' : 'EA fit supports investment.',
    ],
    possibilityHighlights,
    missedOpportunities: recommendations.priorities.map((p) => p.title).slice(0, 3),
    futureStatePrompt: recommendations.journeyStages.map((s) => s.opportunity).join(' '),
  };
}
