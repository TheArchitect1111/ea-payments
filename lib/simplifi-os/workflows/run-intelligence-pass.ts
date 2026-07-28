import { createHash } from 'node:crypto';
import { getCaptures } from '@/lib/capture-records';
import { loadSimplifiWorkspace } from '@/lib/simplifi-core';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import {
  isSimplifiEmbedEnabled,
  isSimplifiIntelligenceEnabled,
  isSimplifiOsConfigured,
} from '../flags';
import { supabaseRest } from '../supabase';
import { detectIntelligenceItems, rankIntelligenceItems } from '../intelligence-detectors';
import { backfillEmbeddings, embedSourceFromObject } from '../embed';

export type IntelligenceWorkflowResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  runId: string;
  portalsProcessed: number;
  itemsUpserted: number;
  embeds?: { attempted: number; written: number; skipped: number; failed: number };
};

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

async function resolvePortalSlugs(limit: number, explicit?: string): Promise<string[]> {
  if (explicit?.trim()) return [explicit.trim().toLowerCase()];
  const fromEnv = (process.env.SIMPLIFI_INTEL_PORTALS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv.slice(0, limit);
  const captures = await getCaptures(80);
  const slugs = new Set<string>();
  for (const c of captures) {
    const slug = c.portalSlug?.trim().toLowerCase();
    if (slug) slugs.add(slug);
  }
  return [...slugs].slice(0, limit);
}

async function beginJob(jobName: string, idempotencyKey: string, portalSlug?: string) {
  if (!isSimplifiOsConfigured()) return { ok: false as const, existing: false };
  const existing = await supabaseRest<Array<{ id: string; status: string }>>(
    `simplifi_job_runs?job_name=eq.${encodeURIComponent(jobName)}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&select=id,status&limit=1`,
    { method: 'GET' },
  );
  if (existing.ok && Array.isArray(existing.data) && existing.data[0]?.status === 'ok') {
    return { ok: false as const, existing: true, id: existing.data[0].id };
  }
  const inserted = await supabaseRest<Array<{ id: string }>>('simplifi_job_runs', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({
      job_name: jobName,
      idempotency_key: idempotencyKey,
      portal_slug: portalSlug ?? null,
      status: 'running',
      result: {},
    }),
  });
  if (!inserted.ok || !Array.isArray(inserted.data) || !inserted.data[0]?.id) {
    return { ok: false as const, existing: true };
  }
  return { ok: true as const, id: inserted.data[0].id };
}

async function finishJob(
  id: string | undefined,
  status: 'ok' | 'error',
  result: Record<string, unknown>,
) {
  if (!id) return;
  await supabaseRest(`simplifi_job_runs?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      result,
      finished_at: new Date().toISOString(),
    }),
  });
}

/**
 * Durable Opportunity Intelligence pass.
 * Cron triggers this; business process lives here (idempotent upsert by fingerprint).
 */
export async function runIntelligenceWorkflow(options?: {
  portalSlug?: string;
  force?: boolean;
}): Promise<IntelligenceWorkflowResult> {
  const runId = createHash('sha1')
    .update(`intel:${options?.portalSlug ?? 'all'}:${dayKey()}`)
    .digest('hex')
    .slice(0, 16);

  if (!isSimplifiIntelligenceEnabled()) {
    return {
      ok: true,
      skipped: true,
      reason: 'SIMPLIFI_INTELLIGENCE off',
      runId,
      portalsProcessed: 0,
      itemsUpserted: 0,
    };
  }

  if (!isSimplifiOsConfigured()) {
    if (options?.portalSlug) {
      const workspace = await loadSimplifiWorkspace(options.portalSlug, EA_PLATFORM_URL, '', 40);
      const drafts = rankIntelligenceItems(detectIntelligenceItems(workspace.objects));
      return {
        ok: true,
        skipped: true,
        reason: 'supabase_unconfigured_dry_run',
        runId,
        portalsProcessed: 1,
        itemsUpserted: drafts.length,
      };
    }
    return {
      ok: true,
      skipped: true,
      reason: 'supabase_unconfigured',
      runId,
      portalsProcessed: 0,
      itemsUpserted: 0,
    };
  }

  const idempotencyKey = options?.force
    ? `intel:${runId}:${Date.now()}`
    : `intel:${options?.portalSlug ?? 'all'}:${dayKey()}`;

  const job = await beginJob('simplifi-intelligence', idempotencyKey, options?.portalSlug);
  if (!job.ok) {
    return {
      ok: true,
      skipped: true,
      reason: job.existing ? 'idempotent_skip' : 'job_start_failed',
      runId,
      portalsProcessed: 0,
      itemsUpserted: 0,
    };
  }

  let portalsProcessed = 0;
  let itemsUpserted = 0;
  let embedStats = { attempted: 0, written: 0, skipped: 0, failed: 0 };

  try {
    const slugs = await resolvePortalSlugs(25, options?.portalSlug);

    for (const slug of slugs) {
      const workspace = await loadSimplifiWorkspace(slug, EA_PLATFORM_URL, '', 50);
      const drafts = rankIntelligenceItems(detectIntelligenceItems(workspace.objects));

      for (const draft of drafts) {
        const row = {
          portal_slug: slug,
          fingerprint: draft.fingerprint,
          item_type: draft.itemType,
          title: draft.title,
          explanation: draft.explanation,
          evidence: draft.evidence,
          confidence: draft.confidence,
          priority: draft.priority,
          related_object_ids: draft.relatedObjectIds,
          next_action: draft.nextAction,
          why_matters: draft.whyMatters,
          status: 'active',
          run_id: runId,
          updated_at: new Date().toISOString(),
          reevaluate_at: draft.reevaluateAt,
          expires_at: draft.expiresAt,
        };
        const upsert = await supabaseRest(
          'simplifi_intelligence_items?on_conflict=portal_slug,fingerprint',
          {
            method: 'POST',
            prefer: 'resolution=merge-duplicates,return=minimal',
            body: JSON.stringify(row),
          },
        );
        if (upsert.ok) itemsUpserted += 1;
      }

      await supabaseRest('simplifi_intelligence_runs', {
        method: 'POST',
        prefer: 'return=minimal',
        body: JSON.stringify({
          portal_slug: slug,
          findings: drafts,
          brief_items: drafts.slice(0, 12),
          ambient_items: drafts
            .filter((d) => d.priority === 'critical' || d.priority === 'high')
            .slice(0, 5),
          status: 'ok',
        }),
      });

      if (isSimplifiEmbedEnabled()) {
        const sources = workspace.activeObjects
          .map((o) => embedSourceFromObject(o, slug))
          .filter((s): s is NonNullable<typeof s> => Boolean(s));
        const stats = await backfillEmbeddings(sources, { limit: 20 });
        embedStats = {
          attempted: embedStats.attempted + stats.attempted,
          written: embedStats.written + stats.written,
          skipped: embedStats.skipped + stats.skipped,
          failed: embedStats.failed + stats.failed,
        };
      }

      portalsProcessed += 1;
    }

    await finishJob(job.id, 'ok', {
      portalsProcessed,
      itemsUpserted,
      embeds: embedStats,
    });

    return {
      ok: true,
      runId,
      portalsProcessed,
      itemsUpserted,
      embeds: embedStats,
    };
  } catch (err) {
    await finishJob(job.id, 'error', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'workflow_failed',
      runId,
      portalsProcessed,
      itemsUpserted,
    };
  }
}
