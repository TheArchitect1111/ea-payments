import type { CaptureRecord } from '@/lib/capture-records';
import { isSimplifiOsWriteEnabled, isSimplifiOsConfigured, isSimplifiEmbedEnabled } from './flags';
import { recordMemoryEvent } from './memory-events';
import { supabaseRest } from './supabase';
import { embedSourceFromCapture, enqueueEmbedding } from './embed';
import type { MemoryClient, SimplifiObjectType } from './types';

function mapCaptureType(type: CaptureRecord['captureType'] | undefined): SimplifiObjectType {
  switch (type) {
    case 'Person':
      return 'person';
    case 'Organization':
      return 'organization';
    case 'Note':
      return 'note';
    case 'Opportunity':
      return 'opportunity';
    default:
      return 'opportunity';
  }
}

/**
 * Dual-write Capture Record → simplifi_objects + Memory Event (+ async embed).
 * Safe no-op when flags/env are off. Never throws into capture path.
 */
export async function afterCaptureOsWrite(input: {
  record: CaptureRecord;
  portalSlug: string;
  client?: MemoryClient;
  actorId?: string;
}): Promise<void> {
  try {
    let objectId: string | undefined;

    if (isSimplifiOsWriteEnabled() && isSimplifiOsConfigured()) {
      const objectType = mapCaptureType(input.record.captureType);
      const upsert = {
        airtable_record_id: input.record.id,
        portal_slug: input.portalSlug,
        title: input.record.title || 'Untitled',
        object_type: objectType,
        status: 'active',
        priority_score: input.record.opportunityScore ?? null,
        next_action: input.record.nextAction ?? null,
        due_date: input.record.dueDate ?? null,
        source_url: input.record.sourceUrl ?? null,
        consider_slug: input.record.considerSlug ?? null,
        share_url: input.record.shareUrl ?? null,
        opportunity_payload: null,
        updated_at: new Date().toISOString(),
      };

      const objResult = await supabaseRest<Array<{ id: string }>>(
        'simplifi_objects?on_conflict=airtable_record_id',
        {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=representation',
          body: JSON.stringify(upsert),
        },
      );

      objectId = objResult.ok && Array.isArray(objResult.data) ? objResult.data[0]?.id : undefined;

      await recordMemoryEvent({
        portalSlug: input.portalSlug,
        eventType: 'capture.created',
        objectId: objectId ?? input.record.id,
        correlationId: input.record.id,
        client: input.client ?? 'web',
        actorId: input.actorId,
        metadata: {
          title: input.record.title,
          airtable_record_id: input.record.id,
          os_object_id: objectId,
          dual_write_ok: objResult.ok,
        },
      });

      if (objectId) {
        await recordMemoryEvent({
          portalSlug: input.portalSlug,
          eventType: 'opportunity.created',
          objectId,
          correlationId: input.record.id,
          client: input.client ?? 'web',
          actorId: input.actorId,
          metadata: { title: input.record.title },
        });
      }
    } else {
      await recordMemoryEvent({
        portalSlug: input.portalSlug,
        eventType: 'capture.created',
        objectId: input.record.id,
        correlationId: input.record.id,
        client: input.client ?? 'web',
        actorId: input.actorId,
        metadata: {
          title: input.record.title,
          airtable_record_id: input.record.id,
        },
      });
    }

    if (isSimplifiEmbedEnabled()) {
      const source = embedSourceFromCapture(input.record, input.portalSlug);
      if (source && objectId) source.objectId = objectId;
      enqueueEmbedding(source);
    }
  } catch (err) {
    console.error('[simplifi-os] afterCaptureOsWrite', err);
  }
}
