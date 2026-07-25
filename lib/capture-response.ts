import type { CapturePipelineResult } from './capture-pipeline';
import type { CaptureRecord, CaptureStatus } from './capture-records';
import type { SimplifiBusinessScores } from './simplifi-business-analysis';
import { buildAmplifiSocialDraft, type AmplifiSocialDraft } from './amplifi-draft';
import { parseOpportunityPayload } from './opportunity-experience';

export interface CaptureApiResponse {
  ok: boolean;
  status?: CaptureStatus;
  processing?: boolean;
  ready?: boolean;
  captureId?: string;
  record?: CaptureRecord;
  scores?: CapturePipelineResult['scores'];
  businessScores?: SimplifiBusinessScores;
  recommendations?: CapturePipelineResult['recommendations'];
  trust?: CapturePipelineResult['trust'];
  magnifiUrl?: string;
  guidanceUrl?: string;
  considerUrl?: string;
  considerSlug?: string;
  clientMessage?: string;
  workspaceUrl?: string;
  opportunityUrl?: string;
  amplifiDraft?: AmplifiSocialDraft;
  /** Decision Intelligence preview — already computed in capture pipeline */
  decisionPath?: string;
  decisionConfidence?: number;
  decisionRationale?: string;
  nextAction?: string;
  error?: string;
}

function amplifiDraftFromResult(result: CapturePipelineResult): AmplifiSocialDraft | undefined {
  const considerUrl = result.opportunity?.shareUrl ?? result.record?.shareUrl;
  if (!considerUrl) return undefined;
  const businessName =
    result.opportunity?.businessName ?? result.record?.businessName ?? result.record?.title ?? '';
  const quickWin = result.opportunity?.magnifi.quickWins?.[0];
  return buildAmplifiSocialDraft({
    businessName,
    considerUrl,
    quickWin,
    headline: result.record?.analysisSummary?.split('\n')[0],
    prospectName: result.record?.prospectName,
  });
}

export function buildCaptureApiResponse(result: CapturePipelineResult): CaptureApiResponse {
  if (!result.ok) {
    return {
      ok: false,
      error: sanitizeCaptureClientError(result.error),
    };
  }

  return {
    ok: true,
    status: result.record?.status,
    processing: false,
    captureId: result.record?.id,
    record: result.record,
    scores: result.scores,
    businessScores: result.opportunity?.analysis.scores,
    recommendations: result.recommendations,
    trust: result.trust,
    magnifiUrl: result.record ? `/magnifi/${result.record.id}` : undefined,
    guidanceUrl: result.record ? `/simplifi/guidance/${result.record.id}` : undefined,
    considerUrl: result.opportunity?.shareUrl ?? result.record?.shareUrl,
    considerSlug: result.opportunity?.prospectSlug ?? result.record?.considerSlug,
    clientMessage: result.opportunity?.clientMessage ?? result.record?.clientMessage,
    workspaceUrl: '/simplifi/workspace',
    opportunityUrl: result.record ? `/simplifi/opportunity/${result.record.id}` : undefined,
    amplifiDraft: amplifiDraftFromResult(result),
    decisionPath: result.intelligence?.decision.recommendedPath,
    decisionConfidence: result.intelligence?.decision.confidenceScore,
    decisionRationale: result.intelligence?.decision.pathRationale,
    nextAction: result.record?.nextAction,
  };
}

/** Client-safe persist errors — never surface Airtable/schema/operator internals. */
export function sanitizeCaptureClientError(raw?: string): string {
  const fallback =
    'We could not save this opportunity yet. Nothing was lost from your device — try again in a moment, or open Simplifi workspace and capture once more.';
  if (!raw?.trim()) return fallback;
  const lower = raw.toLowerCase();
  if (
    lower.includes('airtable') ||
    lower.includes('api_key') ||
    lower.includes('api key') ||
    lower.includes('missing column') ||
    lower.includes('table not found') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden') ||
    lower.includes('422') ||
    lower.includes('401') ||
    lower.includes('schema')
  ) {
    return fallback;
  }
  if (lower.includes('failed to save') || lower.includes('failed to queue')) {
    return fallback;
  }
  // Keep short product messages; truncate long technical dumps
  if (raw.length > 160) return fallback;
  return raw;
}

function amplifiDraftFromRecord(record: CaptureRecord): AmplifiSocialDraft | undefined {
  if (!record.shareUrl) return undefined;
  return buildAmplifiSocialDraft({
    businessName: record.businessName ?? record.title,
    considerUrl: record.shareUrl,
    headline: record.analysisSummary?.split('\n')[0],
    prospectName: record.prospectName,
  });
}

export function buildCaptureStatusResponse(record: CaptureRecord): CaptureApiResponse {
  const ready = record.status === 'Triaged' || record.status === 'Routed';
  const intelligence = ready ? parseOpportunityPayload(record)?.intelligence : undefined;
  return {
    ok: true,
    status: record.status,
    processing: record.status === 'Analyzing',
    ready,
    captureId: record.id,
    record,
    magnifiUrl: `/magnifi/${record.id}`,
    guidanceUrl: `/simplifi/guidance/${record.id}`,
    considerUrl: record.shareUrl,
    considerSlug: record.considerSlug,
    clientMessage: record.clientMessage,
    workspaceUrl: '/simplifi/workspace',
    opportunityUrl: `/simplifi/opportunity/${record.id}`,
    amplifiDraft: ready ? amplifiDraftFromRecord(record) : undefined,
    decisionPath: intelligence?.decision.recommendedPath,
    decisionConfidence: intelligence?.decision.confidenceScore,
    decisionRationale: intelligence?.decision.pathRationale,
    nextAction: record.nextAction,
  };
}
