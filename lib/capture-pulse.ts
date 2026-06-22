import type { CaptureRecord } from './capture-records';
import { emitPulseEvent } from './pulse-bus';

export async function emitCaptureCompleted(record: CaptureRecord, portalSlug?: string) {
  await emitPulseEvent({
    product: 'simplifi',
    type: 'capture.completed',
    title: record.title,
    detail: 'Magnifi story ready',
    href: '/simplifi/workspace',
    objectId: record.id,
    tenantId: portalSlug ?? record.portalSlug,
    priority: 'medium',
  });
}
