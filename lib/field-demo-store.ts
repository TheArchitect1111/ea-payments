/**
 * Durable field-demo packs for public /demo/{slug}/report pages.
 * Uses Creative Studio memory + Airtable when configured.
 */
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import type { CtpExecutiveSnapshot } from '@/lib/ctp-executive-snapshot';

export type FieldDemoPack = {
  version: 1;
  slug: string;
  client: string;
  industry?: string;
  goal: string;
  deliverable: string;
  notes?: string;
  siteUrl: string;
  portalLoginUrl: string;
  portalUrl: string;
  reportUrl: string;
  launchId?: string;
  launchReviewUrl?: string;
  organizationId?: string;
  talkingPoints: string;
  snapshot: CtpExecutiveSnapshot;
  source: 'field-demo';
  createdAt: string;
  errors: string[];
};

function packId(slug: string): string {
  return `field-demo-${slug.trim().toLowerCase()}`;
}

export async function saveFieldDemoPack(pack: FieldDemoPack): Promise<{ ok: boolean; error?: string }> {
  const result = await saveStudioRecord({
    recordType: 'media',
    id: packId(pack.slug),
    organizationId: pack.organizationId || pack.slug,
    payload: pack,
    title: `Field Demo — ${pack.client}`,
  });
  return { ok: result.ok, error: result.error };
}

export async function getFieldDemoPack(slug: string): Promise<FieldDemoPack | null> {
  const stored = await loadStudioRecord<FieldDemoPack>('media', packId(slug));
  if (!stored || stored.version !== 1 || stored.source !== 'field-demo') return null;
  return stored;
}
