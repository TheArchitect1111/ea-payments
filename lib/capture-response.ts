import type { CapturePipelineResult } from './capture-pipeline';
import type { CaptureRecord, CaptureStatus } from './capture-records';
import type { SimplifiBusinessScores } from './simplifi-business-analysis';
import { buildAmplifiSocialDraft, type AmplifiSocialDraft } from './amplifi-draft';

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
  amplifiDraft?: AmplifiSocialDraft;
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
    return { ok: false, error: result.error ?? 'Capture failed.' };
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
    amplifiDraft: amplifiDraftFromResult(result),
  };
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
    amplifiDraft: ready ? amplifiDraftFromRecord(record) : undefined,
  };
}
