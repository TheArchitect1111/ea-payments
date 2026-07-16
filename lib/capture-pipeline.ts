import { scrapeUrl } from './firecrawl';
import {
  buildPageFromAsset,
  derivePendingTitle,
  type IngestInput,
} from './asset-ingest';
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
  getCaptureByIdentifier,
  updateCaptureStatus,
  updateOpportunityExperience,
  updateObjectGuidance,
  type CaptureRecord,
} from './capture-records';
import { buildGuidanceTriple } from './guidance-triple';
import { EA_PLATFORM_URL } from './platform-urls';
import {
  buildSimplifiIntelligence,
  formatIntelligenceSummary,
} from './intelligence-bundle';
import {
  applyThinContentTrustPenalty,
  countPageWords,
  isThinPage,
  mergeAuditIntoAnalysis,
  thinContentUserNote,
} from './capture-signal-quality';
import { runWebsiteAudit } from './website-audit';
import type { OpportunityAnalysis } from './simplifi-business-analysis';

export interface CapturePipelineResult {
  ok: boolean;
  record?: CaptureRecord;
  classification?: ResourceClassification;
  scores?: OpportunityScores;
  recommendations?: RecommendationResult;
  blueprint?: BlueprintStub;
  trust?: TrustMetadata;
  opportunity?: OpportunityExperiencePayload;
  intelligence?: ReturnType<typeof buildSimplifiIntelligence>;
  error?: string;
}

export interface AnalyzeOptions {
  generateBlueprint?: boolean;
  portalSlug?: string;
  prospectName?: string;
  baseUrl?: string;
  existingRecordId?: string;
}

export interface CaptureInput extends IngestInput {
  url?: string;
}

function portalSlugFromSource(source: string): string | undefined {
  const match = source.match(/Simplifi Portal · ([^\s]+)/);
  return match?.[1];
}

async function resolvePageInput(input: CaptureInput): Promise<{ page: Awaited<ReturnType<typeof scrapeUrl>>; sourceUrl: string }> {
  if (input.url?.trim()) {
    const url = input.url.trim();
    const page = await scrapeUrl(url);
    return { page, sourceUrl: url };
  }

  if (input.fileName?.trim() || input.fileBase64 || input.screenshotBase64) {
    const page = await buildPageFromAsset(input);
    return { page, sourceUrl: page.url };
  }

  throw new Error('Provide a URL or upload a file.');
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
  let businessAnalysis: OpportunityAnalysis = analyzeBusinessOpportunity(
    page,
    classification,
    eaFitScore,
    uploadType,
  );
  const extraction = extractBusinessSignals(page, classification, uploadType);
  const wordCount = countPageWords(page);
  const thin = isThinPage(page);
  let trust = applyThinContentTrustPenalty(
    buildTrustMetadata(page, classification, scores, sourceUrl),
    wordCount,
  );

  const isHttpUrl = /^https?:\/\//i.test(sourceUrl);
  if (isHttpUrl && thin) {
    try {
      const audit = await runWebsiteAudit(sourceUrl);
      businessAnalysis = mergeAuditIntoAnalysis(businessAnalysis, audit);
      trust = {
        ...trust,
        confidenceLabel: 'Low',
        reasoning: [
          ...trust.reasoning,
          `Website audit (${audit.source}) clarity ${audit.clarityScore}/100; ${audit.findings.length} finding(s).`,
        ],
        sources: [
          ...trust.sources,
          { label: `Website audit · ${audit.source}`, type: 'pattern', url: sourceUrl },
        ],
      };
    } catch {
      // Audit is enrichment only — pipeline continues with thin-content note.
    }
  }

  const recommendations = generateRecommendations(classification, page, scores);
  const blueprint =
    options.generateBlueprint !== false
      ? generateBlueprintStub(sourceUrl, page, classification, scores, recommendations)
      : undefined;

  const businessName = extraction.businessName || page.title || sourceUrl;
  const intelligence = buildSimplifiIntelligence({
    page,
    classification,
    scores,
    recommendations,
    businessName,
    sourceUrl,
  });

  const baseUrl =
    options.baseUrl ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    EA_PLATFORM_URL;

  const portalSlug = options.portalSlug ?? portalSlugFromSource(source);

  const analysisSummary = [
    buildAnalysisSummary(page, classification, scores),
    formatScoresLine(businessAnalysis.scores),
    thin ? thinContentUserNote(wordCount) : '',
    '',
    `Strengths: ${businessAnalysis.strengths.join('; ')}`,
    `Missed: ${businessAnalysis.missedOpportunities.join('; ')}`,
    '',
    formatRecommendationSummary(recommendations),
    `\n${formatIntelligenceSummary(intelligence)}`,
    blueprint ? `\n--- Auto Blueprint ---\n${formatBlueprintSummary(blueprint).slice(0, 1200)}…` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const title = extraction.businessName || page.title || sourceUrl;
  const finalStatus = blueprint ? 'Routed' : 'Triaged';

  let recordId = options.existingRecordId;
  let record: CaptureRecord | undefined;

  if (!recordId) {
    const createResult = await createCaptureRecord({
      title,
      description: analysisSummary,
      sourceUrl: sourceUrl.startsWith('upload://') || sourceUrl.startsWith('screenshot://') ? undefined : sourceUrl,
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
      trustConfidence: Math.min(businessAnalysis.scores.trust, trust.confidence),
      recommendationSummary: formatRecommendationSummary(recommendations),
      blueprintSummary: blueprint ? formatBlueprintSummary(blueprint) : undefined,
      visibilityScore: businessAnalysis.scores.visibility,
      exposureScore: businessAnalysis.scores.exposure,
      conversionScore: businessAnalysis.scores.conversion,
      differentiationScore: businessAnalysis.scores.differentiation,
      modernityScore: businessAnalysis.scores.modernity,
      businessName: extraction.businessName,
      prospectStatus: 'New',
      portalSlug,
    });

    if (!createResult.ok || !createResult.record) {
      return { ok: false, error: createResult.error ?? 'Failed to save capture.' };
    }

    recordId = createResult.record.id;
    record = createResult.record;
  }

  const opportunity = buildOpportunityPayload({
    businessName: extraction.businessName || title,
    prospectName: options.prospectName,
    extraction,
    analysis: businessAnalysis,
    recommendations,
    baseUrl,
    portalSlug,
    captureRecordId: recordId,
    uniqueSuffix: recordId.replace('rec', '').slice(-6),
    intelligence,
    lowSignal: thin || trust.confidenceLabel === 'Low',
  });

  const descriptionWithPayload = embedOpportunityPayload(analysisSummary, opportunity);

  await updateOpportunityExperience(recordId, {
    status: finalStatus,
    analysisSummary,
    description: descriptionWithPayload,
    eaFitScore: scores.eaFitScore,
    opportunityScore: scores.opportunityScore,
    productAlignment: classification.productAlignment,
    blueprintTemplate: recommendations.template.name,
    trustConfidence: Math.min(businessAnalysis.scores.trust, trust.confidence),
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

  const updated = await getCaptureByIdentifier(recordId);
  record = updated ?? record;

  if (record) {
    const triple = buildGuidanceTriple(record);
    await updateObjectGuidance(recordId, {
      nextAction: triple.nextAction,
      dueDate: triple.suggestedDueDate,
      whyThisMatters: triple.whyThisMatters,
      whatMostPeopleDo: triple.whatMostPeopleDo,
      whatWeRecommend: triple.whatWeRecommend,
    });
    const withGuidance = await getCaptureByIdentifier(recordId);
    record = withGuidance ?? record;
  }

  return {
    ok: true,
    record: {
      ...(record ?? { id: recordId, captureId: recordId, title, captureType: 'Opportunity', source, priority: scores.priority, status: finalStatus, dateCaptured: '' }),
      status: finalStatus,
      title: opportunity.businessName || title,
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
    intelligence,
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
    const pageInput = await resolvePageInput(input);
    return runCapturePipeline(pageInput, source, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Capture pipeline failed.';
    return { ok: false, error: message };
  }
}

/** Create a placeholder record and return immediately for background processing. */
export async function enqueueCaptureAsset(
  input: CaptureInput,
  source: string,
  options: AnalyzeOptions = {},
): Promise<CapturePipelineResult> {
  const title = derivePendingTitle(input);
  const sourceUrl = input.url?.trim() || input.pageUrl?.trim();

  const createResult = await createCaptureRecord({
    title,
    description: 'Analysis in progress…',
    sourceUrl: sourceUrl && !sourceUrl.startsWith('screenshot://') ? sourceUrl : undefined,
    source,
    captureType: 'Opportunity',
    priority: 'Normal',
    status: 'Analyzing',
    prospectName: options.prospectName,
    portalSlug: options.portalSlug,
    prospectStatus: 'New',
  });

  if (!createResult.ok || !createResult.record) {
    return { ok: false, error: createResult.error ?? 'Failed to queue capture.' };
  }

  return { ok: true, record: createResult.record };
}

/** Complete analysis for a queued capture record. */
export async function processCaptureAsset(
  recordId: string,
  input: CaptureInput,
  source: string,
  options: AnalyzeOptions = {},
): Promise<CapturePipelineResult> {
  try {
    const pageInput = await resolvePageInput(input);
    const result = await runCapturePipeline(pageInput, source, {
      ...options,
      existingRecordId: recordId,
    });
    if (!result.ok) {
      await updateCaptureStatus(recordId, 'Captured');
    }
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Capture pipeline failed.';
    await updateCaptureStatus(recordId, 'Captured');
    return { ok: false, error: message };
  }
}
