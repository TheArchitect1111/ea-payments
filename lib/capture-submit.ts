import {
  analyzeAndCapture,
  analyzeAndCaptureAsset,
  enqueueCaptureAsset,
  type AnalyzeOptions,
  type CaptureInput,
  type CapturePipelineResult,
} from './capture-pipeline';
import { scheduleCaptureJob, type ScheduleCaptureJobOptions } from './capture-async';
import type { CaptureRecord } from './capture-records';
import { buildCaptureApiResponse, type CaptureApiResponse } from './capture-response';
import { emitCaptureCompleted } from './capture-pulse';

export interface CaptureSubmissionOptions extends AnalyzeOptions, ScheduleCaptureJobOptions {
  asyncMode?: boolean;
}

export interface CaptureSubmissionResult {
  ok: boolean;
  asyncQueued?: boolean;
  pipeline?: CapturePipelineResult;
  record?: CaptureRecord;
  error?: string;
}

export async function submitCapture(
  input: CaptureInput,
  source: string,
  options: CaptureSubmissionOptions = {},
): Promise<CaptureSubmissionResult> {
  const asyncMode = options.asyncMode !== false;

  if (asyncMode) {
    const queued = await enqueueCaptureAsset(input, source, options);
    if (!queued.ok || !queued.record) {
      return { ok: false, error: queued.error ?? 'Could not queue capture.' };
    }

    scheduleCaptureJob(queued.record.id, input, source, options);

    return {
      ok: true,
      asyncQueued: true,
      record: queued.record,
    };
  }

  const url = input.url?.trim();
  const pipeline = url
    ? await analyzeAndCapture(url, source, options)
    : await analyzeAndCaptureAsset(input, source, options);

  if (!pipeline.ok) {
    return { ok: false, error: pipeline.error ?? 'Capture failed.' };
  }

  if (pipeline.record) {
    await emitCaptureCompleted(pipeline.record, options.portalSlug);
  }

  return {
    ok: true,
    asyncQueued: false,
    pipeline,
    record: pipeline.record,
  };
}

export function toCaptureApiResponse(result: CaptureSubmissionResult): CaptureApiResponse {
  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Capture failed.' };
  }

  if (result.asyncQueued && result.record) {
    return {
      ok: true,
      processing: true,
      captureId: result.record.id,
      status: 'Analyzing',
      record: result.record,
      magnifiUrl: `/magnifi/${result.record.id}`,
      guidanceUrl: `/simplifi/guidance/${result.record.id}`,
      workspaceUrl: '/simplifi/workspace',
    };
  }

  if (result.pipeline) {
    const response = buildCaptureApiResponse(result.pipeline);
    return { ...response, workspaceUrl: '/simplifi/workspace' };
  }

  return { ok: false, error: 'Capture failed.' };
}
