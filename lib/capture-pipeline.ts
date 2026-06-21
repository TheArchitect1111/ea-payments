import { scrapeUrl } from './firecrawl';
import { buildPageFromUpload, type IngestInput } from './asset-ingest';
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
  buildOpportunityPayload,
  embedOpportunityPayload,
  type OpportunityExperiencePayload,
} from './opportunity-experience';
import {
  analyzeBusinessOpportunity,
  extractBusinessSignals,
  formatScoresLine,
} from './simplifi-business-analysis';
import {
  createCaptureRecord,
  updateCaptureAnalysis,
  updateOpportunityExperience,
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
  opportunity?: OpportunityExperiencePayload;
  error?: string;
}

export interface AnalyzeOptions {
  generateBlueprint?: boolean;
  portalSlug?: string;
  prospectName?: string;
  baseUrl?: string;
}

export interface CaptureInput extends IngestInput {
  url?: string;
}

function portalSlugFromSource(source: string): string | undefined {
  const match = source.match(/Simplifi Portal · ([^\s]+)/);
  return match?.[1];
}

async function runCapturePipeline(
  pageInput: { page: Awaited<ReturnType<typeof scrapeUrl>>; sourceUrl: string },
  source: string,
  options: AnalyzeOptions,
): Promise<CapturePipelineResult> {
  const { page, sourceUrl } = pageInput;
  const uploadType = page.metadata?.mimeType || page.metadata?.uploadKind;

  const classification = classifyResource(sourceUrl, page);
  const eaFitScore = computeEaFitScore(classification, page);
  const scores = scoreOpportunity(classification, page, eaFitScore);
  const businessAnalysis = analyzeBusinessOpportunity(page, classification, eaFitScore, uploadType);
  const extraction = extractBusinessSignals(page, classification, uploadType);
  const trust = buildTrustMetadata(page, classification, scores, sourceUrl);
  const recommendations = generateRecommendations(classification, page, scores);
  const blueprint =
    options.generateBlueprint !== false
      ? generateBlueprintStub(sourceUrl, page, classification, scores, recommendations)
      : undefined;

  const baseUrl =
    options.baseUrl ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    'https://ea-payments.vercel.app';

  const portalSlug = options.portalSlug ?? portalSlugFromSource(source);

  const analysisSummary = [
    buildAnalysisSummary(page, classification, scores),
    formatScoresLine(businessAnalysis.scores),
    '',
    `Strengths: ${businessAnalysis.strengths.join('; ')}`,
    `Missed: ${businessAnalysis.missedOpportunities.join('; ')}`,
    '',
    formatRecommendationSummary(recommendations),
    blueprint ? `\n--- Auto Blueprint ---\n${formatBlueprintSummary(blueprint).slice(0, 1200)}…` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const createResult = await createCaptureRecord({
    title: extraction.businessName || page.title || sourceUrl,
    description: analysisSummary,
    sourceUrl: sourceUrl.startsWith('upload://') ? undefined : sourceUrl,
    source,
    captureType: 'Opportunity',
    category: classification.category,
    priority: scores.priority,
    tags: [
      classification.industry,
      classification.buildVsBuy,
      `scrape:${page.source}`,
      recommendations.template.name,
      uploadType ? `upload:${uploadType}` : '',
      ...classification.productAlignment.slice(0, 3),
    ].filter(Boolean),
    eaFitScore: scores.eaFitScore,
    opportunityScore: scores.opportunityScore,
    analysisSummary,
    productAlignment: classification.productAlignment,
    status: 'Analyzing',
    blueprintTemplate: recommendations.template.name,
    trustConfidence: businessAnalysis.scores.trust,
    recommendationSummary: formatRecommendationSummary(recommendations),
    blueprintSummary: blueprint ? formatBlueprintSummary(blueprint) : undefined,
    visibilityScore: businessAnalysis.scores.visibility,
    exposureScore: businessAnalysis.scores.exposure,
    conversionScore: businessAnalysis.scores.conversion,
    differentiationScore: businessAnalysis.scores.differentiation,
    modernityScore: businessAnalysis.scores.modernity,
    businessName: extraction.businessName,
    prospectStatus: 'New',
  });

  if (!createResult.ok || !createResult.record) {
    return { ok: false, error: createResult.error ?? 'Failed to save capture.' };
  }

  const opportunity = buildOpportunityPayload({
    businessName: extraction.businessName || createResult.record.title,
    prospectName: options.prospectName,
    extraction,
    analysis: businessAnalysis,
    recommendations,
    baseUrl,
    portalSlug,
    captureRecordId: createResult.record.id,
    uniqueSuffix: createResult.record.id.replace('rec', '').slice(-6),
  });

  const descriptionWithPayload = embedOpportunityPayload(analysisSummary, opportunity);

  await updateOpportunityExperience(createResult.record.id, {
    status: blueprint ? 'Routed' : 'Triaged',
    analysisSummary,
    description: descriptionWithPayload,
    eaFitScore: scores.eaFitScore,
    opportunityScore: scores.opportunityScore,
    productAlignment: classification.productAlignment,
    blueprintTemplate: recommendations.template.name,
    trustConfidence: businessAnalysis.scores.trust,
    recommendationSummary: formatRecommendationSummary(recommendations),
    blueprintSummary: blueprint ? formatBlueprintSummary(blueprint) : undefined,
    considerSlug: opportunity.prospectSlug,
    prospectName: options.prospectName ?? extraction.businessName,
    businessName: opportunity.businessName,
    shareUrl: opportunity.shareUrl,
    clientMessage: opportunity.clientMessage,
    visibilityScore: businessAnalysis.scores.visibility,
    exposureScore: businessAnalysis.scores.exposure,
    conversionScore: businessAnalysis.scores.conversion,
    differentiationScore: businessAnalysis.scores.differentiation,
    modernityScore: businessAnalysis.scores.modernity,
    prospectStatus: 'Shared',
    portalSlug,
  });

  return {
    ok: true,
    record: {
      ...createResult.record,
      status: blueprint ? 'Routed' : 'Triaged',
      description: descriptionWithPayload,
      considerSlug: opportunity.prospectSlug,
      shareUrl: opportunity.shareUrl,
      clientMessage: opportunity.clientMessage,
    },
    classification,
    scores,
    recommendations,
    blueprint,
    trust,
    opportunity,
  };
}

export async function analyzeAndCapture(
  url: string,
  source: string,
  options: AnalyzeOptions = {},
): Promise<CapturePipelineResult> {
  try {
    const page = await scrapeUrl(url);
    return runCapturePipeline({ page, sourceUrl: url }, source, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Capture pipeline failed.';
    return { ok: false, error: message };
  }
}

export async function analyzeAndCaptureAsset(
  input: CaptureInput,
  source: string,
  options: AnalyzeOptions = {},
): Promise<CapturePipelineResult> {
  try {
    if (input.url?.trim()) {
      return analyzeAndCapture(input.url.trim(), source, options);
    }

    if (!input.fileName?.trim()) {
      return { ok: false, error: 'Provide a URL or upload a file.' };
    }

    const page = buildPageFromUpload(input);
    return runCapturePipeline({ page, sourceUrl: page.url }, source, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Capture pipeline failed.';
    return { ok: false, error: message };
  }
}
