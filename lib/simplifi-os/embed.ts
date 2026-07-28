import type { CaptureRecord } from '@/lib/capture-records';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import { isSimplifiEmbedEnabled, isSimplifiOsConfigured } from './flags';
import {
  embedText,
  getEmbeddingModel,
  getEmbeddingVersion,
  hashEmbedContent,
} from './embed-provider';
import { supabaseRest } from './supabase';

export type EmbedSource = {
  portalSlug: string;
  airtableRecordId: string;
  objectId?: string;
  objectType: string;
  text: string;
};

function buildSourceText(input: {
  title: string;
  nextAction?: string;
  why?: string;
  summary?: string;
  notes?: string;
  owner?: string;
  type?: string;
}): string {
  return [
    input.title,
    input.type ? `Type: ${input.type}` : '',
    input.owner ? `Person/context: ${input.owner}` : '',
    input.nextAction ? `Next: ${input.nextAction}` : '',
    input.why ?? '',
    input.summary ?? '',
    input.notes ?? '',
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}

export function embedSourceFromCapture(record: CaptureRecord, portalSlug: string): EmbedSource | null {
  const text = buildSourceText({
    title: record.title,
    type: record.captureType,
    nextAction: record.nextAction,
    why: record.whyThisMatters,
    summary: record.analysisSummary ?? record.description,
    notes: record.saveReason,
    owner: record.prospectName ?? record.businessName ?? record.owner,
  });
  if (!text) return null;
  return {
    portalSlug,
    airtableRecordId: record.id,
    objectType: (record.captureType || 'opportunity').toLowerCase(),
    text,
  };
}

export function embedSourceFromObject(obj: SimplifiObject, portalSlug: string): EmbedSource | null {
  const text = buildSourceText({
    title: obj.title,
    type: obj.type,
    nextAction: obj.nextAction,
    why: obj.whyThisMatters,
    summary: obj.whatWeRecommend,
    notes: obj.saveReason ?? obj.savePurpose,
    owner: obj.owner,
  });
  if (!text) return null;
  return {
    portalSlug,
    airtableRecordId: obj.id,
    objectType: obj.type.toLowerCase(),
    text,
  };
}

type ExistingEmbed = {
  id: string;
  content_hash: string;
  status: string;
  retry_count: number;
};

/**
 * Upsert embedding for one source. Skips when content hash unchanged.
 */
export async function upsertEmbedding(source: EmbedSource): Promise<{
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  status?: string;
}> {
  if (!isSimplifiEmbedEnabled() || !isSimplifiOsConfigured()) {
    return { ok: true, skipped: true, reason: 'embed_flag_or_supabase_off' };
  }

  const contentHash = hashEmbedContent(source.text);
  const model = getEmbeddingModel();
  const version = getEmbeddingVersion();
  const chunkId = 'primary';

  const existingRes = await supabaseRest<ExistingEmbed[]>(
    `simplifi_embeddings?portal_slug=eq.${encodeURIComponent(source.portalSlug)}&airtable_record_id=eq.${encodeURIComponent(source.airtableRecordId)}&chunk_id=eq.${chunkId}&model=eq.${encodeURIComponent(model)}&select=id,content_hash,status,retry_count&limit=1`,
    { method: 'GET' },
  );

  const existing =
    existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data[0] : undefined;

  if (existing?.content_hash === contentHash && existing.status === 'ready') {
    return { ok: true, skipped: true, reason: 'unchanged', status: 'ready' };
  }

  const priorRetry = Number(existing?.retry_count ?? 0);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  const embedded = await embedText(source.text, { signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );

  const baseRow = {
    portal_slug: source.portalSlug,
    airtable_record_id: source.airtableRecordId,
    object_id: source.objectId ?? null,
    chunk_id: chunkId,
    content_hash: contentHash,
    source_object_type: source.objectType,
    source_text: source.text.slice(0, 12000),
    model,
    embedding_version: version,
    updated_at: new Date().toISOString(),
  };

  if (!embedded) {
    const failRow = {
      ...baseRow,
      status: 'failed',
      retry_count: priorRetry + 1,
      embedding: null,
    };
    if (existing?.id) {
      await supabaseRest(`simplifi_embeddings?id=eq.${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(failRow),
      });
    } else {
      await supabaseRest('simplifi_embeddings', {
        method: 'POST',
        prefer: 'return=minimal',
        body: JSON.stringify({ ...failRow, created_at: new Date().toISOString() }),
      });
    }
    return { ok: false, reason: 'provider_failed', status: 'failed' };
  }

  const readyRow = {
    ...baseRow,
    model: embedded.model,
    status: 'ready',
    retry_count: 0,
    embedding: `[${embedded.embedding.join(',')}]`,
  };

  const write = existing?.id
    ? await supabaseRest(`simplifi_embeddings?id=eq.${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(readyRow),
      })
    : await supabaseRest('simplifi_embeddings', {
        method: 'POST',
        prefer: 'return=minimal',
        body: JSON.stringify({ ...readyRow, created_at: new Date().toISOString() }),
      });

  if (!write.ok) {
    console.error('[simplifi-os] upsertEmbedding', write.error);
    return { ok: false, reason: write.error, status: 'failed' };
  }
  return { ok: true, status: 'ready' };
}

export function enqueueEmbedding(source: EmbedSource | null): void {
  if (!source) return;
  void upsertEmbedding(source).catch((err) => {
    console.error('[simplifi-os] enqueueEmbedding', err);
  });
}

export async function backfillEmbeddings(
  sources: EmbedSource[],
  options?: { limit?: number },
): Promise<{ attempted: number; written: number; skipped: number; failed: number }> {
  const limit = options?.limit ?? 40;
  let written = 0;
  let skipped = 0;
  let failed = 0;
  const slice = sources.slice(0, limit);
  for (const source of slice) {
    const r = await upsertEmbedding(source);
    if (r.skipped) skipped += 1;
    else if (r.ok) written += 1;
    else failed += 1;
  }
  return { attempted: slice.length, written, skipped, failed };
}
