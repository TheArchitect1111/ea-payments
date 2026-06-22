import type { ScrapedPage } from './firecrawl';
import type { ResourceClassification } from './resource-radar';
import type { OpportunityScores } from './opportunity-engine';
import type { RecommendationResult } from './recommendation-engine';
import {
  buildDecisionIntelligence,
  type DecisionIntelligenceReport,
} from './decision-intelligence';
import { buildBuildIntelligence, type ImplementationBlueprint } from './build-intelligence';

export interface SimplifiIntelligenceBundle {
  version: 1;
  generatedAt: string;
  magnifiContext: {
    businessName: string;
    industry: string;
    template: string;
    sourceUrl: string;
  };
  decision: DecisionIntelligenceReport;
  build: ImplementationBlueprint;
}

export function buildSimplifiIntelligence(input: {
  page: ScrapedPage;
  classification: ResourceClassification;
  scores: OpportunityScores;
  recommendations: RecommendationResult;
  businessName: string;
  sourceUrl: string;
}): SimplifiIntelligenceBundle {
  const decision = buildDecisionIntelligence(input);
  const build = buildBuildIntelligence({ ...input, decision });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    magnifiContext: {
      businessName: input.businessName,
      industry: input.classification.industry,
      template: input.recommendations.template.name,
      sourceUrl: input.sourceUrl,
    },
    decision,
    build,
  };
}

export function formatIntelligenceSummary(bundle: SimplifiIntelligenceBundle): string {
  const { decision, build } = bundle;
  return [
    '--- Simplifi Intelligence™ ---',
    `Path: ${decision.recommendedPath} (${decision.confidenceScore}/100 confidence)`,
    build.executiveSummary,
    `Build path: ${build.buildPath}`,
    `Overlay: ${build.overlayConfidence.overall} · Savings ~${build.overlayConfidence.developmentSavingsPercent}%`,
    `Repos: ${build.repoMatches.map((r) => r.repo.name).join(', ') || 'ea-payments'}`,
  ].join('\n');
}
