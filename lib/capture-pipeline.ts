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
  createCaptureRecord,
  updateCaptureAnalysis,
  type CaptureRecord,
} from './capture-records';

export interface CapturePipelineResult {
  ok: boolean;
  record?: CaptureRecord;
  classification?: ResourceClassification;
  scores?: OpportunityScores;
  error?: string;
}

export async function analyzeAndCapture(
  url: string,
  source: string
): Promise<CapturePipelineResult> {
  try {
    const page = await scrapeUrl(url);
    const classification = classifyResource(url, page);
    const eaFitScore = computeEaFitScore(classification, page);
    const scores = scoreOpportunity(classification, page, eaFitScore);
    const analysisSummary = buildAnalysisSummary(page, classification, scores);

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
        ...classification.productAlignment.slice(0, 3),
      ],
      eaFitScore: scores.eaFitScore,
      opportunityScore: scores.opportunityScore,
      analysisSummary,
      productAlignment: classification.productAlignment,
      status: 'Analyzing',
    });

    if (!createResult.ok || !createResult.record) {
      return { ok: false, error: createResult.error ?? 'Failed to save capture.' };
    }

    await updateCaptureAnalysis(createResult.record.id, {
      status: 'Triaged',
      analysisSummary,
      eaFitScore: scores.eaFitScore,
      opportunityScore: scores.opportunityScore,
      productAlignment: classification.productAlignment,
    });

    return {
      ok: true,
      record: { ...createResult.record, status: 'Triaged' },
      classification,
      scores,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Capture pipeline failed.';
    return { ok: false, error: message };
  }
}
