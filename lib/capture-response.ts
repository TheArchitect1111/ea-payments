import type { CapturePipelineResult } from './capture-pipeline';
import type { CaptureRecord, CaptureStatus } from './capture-records';
import type { SimplifiBusinessScores } from './simplifi-business-analysis';

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
  error?: string;
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
  };
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
  };
}
