import { scrapeUrl } from './firecrawl';
import {
  classifyResource,
  computeEaFitScore,
  type ResourceClassification,
} from './resource-radar';
import {
  buildAnalysisSummary,
  scoreOpportunity,
  type OpportunityScores,
} from './opportunity-engine';
import {
  generateRecommendations,
  formatRecommendationSummary,
  type RecommendationResult,
} from './recommendation-engine';
import {
  generateBlueprintStub,
  formatBlueprintSummary,
  type BlueprintStub,
} from './blueprint-generator';
import { buildTrustMetadata, type TrustMetadata } from './trust-metadata';
import {
  createCaptureRecord,
  updateCaptureAnalysis,
  type CaptureRecord,
} from './capture-records';

export interface CapturePipelineResult {
  ok: boolean;
  record?: CaptureRecord;
  classification?: ResourceClassification;
  scores?: OpportunityScores;
  recommendations?: RecommendationResult;
  blueprint?: BlueprintStub;
  trust?: TrustMetadata;
  error?: string;
}

export interface AnalyzeOptions {
  generateBlueprint?: boolean;
}

export async function analyzeAndCapture(
  url: string,
  source: string,
  options: AnalyzeOptions = {}
): Promise<CapturePipelineResult> {
  try {
    const page = await scrapeUrl(url);
    const classification = classifyResource(url, page);
    const eaFitScore = computeEaFitScore(classification, page);
    const scores = scoreOpportunity(classification, page, eaFitScore);
    const trust = buildTrustMetadata(page, classification, scores, url);
    const recommendations = generateRecommendations(classification, page, scores);
    const blueprint =
      options.generateBlueprint !== false
        ? generateBlueprintStub(url, page, classification, scores, recommendations)
        : undefined;

    const analysisSummary = [
      buildAnalysisSummary(page, classification, scores),
      '',
      formatRecommendationSummary(recommendations),
      blueprint ? `\n--- Auto Blueprint ---\n${formatBlueprintSummary(blueprint).slice(0, 1200)}…` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const createResult = await createCaptureRecord({
      title: page.title || url,
      description: analysisSummary,
      sourceUrl: url,
      source,
      captureType: classification.captureType,
      category: classification.category,
      priority: scores.priority,
      tags: [
        classification.industry,
        classification.buildVsBuy,
        `scrape:${page.source}`,
        recommendations.template.name,
        ...classification.productAlignment.slice(0, 3),
      ],
      eaFitScore: scores.eaFitScore,
      opportunityScore: scores.opportunityScore,
      analysisSummary,
      productAlignment: classification.productAlignment,
      status: 'Analyzing',
      blueprintTemplate: recommendations.template.name,
      trustConfidence: trust.confidence,
      recommendationSummary: formatRecommendationSummary(recommendations),
      blueprintSummary: blueprint ? formatBlueprintSummary(blueprint) : undefined,
    });

    if (!createResult.ok || !createResult.record) {
      return { ok: false, error: createResult.error ?? 'Failed to save capture.' };
    }

    await updateCaptureAnalysis(createResult.record.id, {
      status: blueprint ? 'Routed' : 'Triaged',
      analysisSummary,
      eaFitScore: scores.eaFitScore,
      opportunityScore: scores.opportunityScore,
      productAlignment: classification.productAlignment,
      blueprintTemplate: recommendations.template.name,
      trustConfidence: trust.confidence,
      recommendationSummary: formatRecommendationSummary(recommendations),
      blueprintSummary: blueprint ? formatBlueprintSummary(blueprint) : undefined,
    });

    return {
      ok: true,
      record: {
        ...createResult.record,
        status: blueprint ? 'Routed' : 'Triaged',
      },
      classification,
      scores,
      recommendations,
      blueprint,
      trust,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Capture pipeline failed.';
    return { ok: false, error: message };
  }
}
