import { randomUUID } from 'crypto';
import { listStudioRecords, loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import type { MediaAsset, MediaAssetKind } from '@/lib/creative-studio/types';

const DEFAULT_ORG = process.env.EA_INTERNAL_ORG_ID ?? 'ea';

export async function listMediaAssets(organizationId = DEFAULT_ORG): Promise<MediaAsset[]> {
  const items = await listStudioRecords<MediaAsset>('media', organizationId);
  return items.filter((item) => !item.tags.includes('_deleted'));
}

export async function getMediaAsset(id: string): Promise<MediaAsset | null> {
  return loadStudioRecord<MediaAsset>('media', id);
}

export async function saveMediaAsset(input: {
  organizationId?: string;
  kind: MediaAssetKind;
  label: string;
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  altText?: string;
  rightsConfirmed?: boolean;
  rightsSource?: string;
  publiclyReachable?: boolean;
  tags?: string[];
  id?: string;
}): Promise<MediaAsset> {
  const organizationId = input.organizationId ?? DEFAULT_ORG;
  const now = new Date().toISOString();
  const existing = input.id ? await getMediaAsset(input.id) : null;

  const asset: MediaAsset = {
    id: input.id ?? randomUUID(),
    organizationId,
    kind: input.kind,
    label: input.label.trim() || 'Untitled',
    url: input.url.trim(),
    mimeType: input.mimeType?.trim(),
    width: input.width,
    height: input.height,
    fileSizeBytes: input.fileSizeBytes,
    altText: input.altText?.trim(),
    rightsConfirmed: input.rightsConfirmed ?? existing?.rightsConfirmed ?? false,
    rightsSource: input.rightsSource?.trim(),
    publiclyReachable: input.publiclyReachable ?? true,
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? existing?.tags ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await saveStudioRecord({
    recordType: 'media',
    id: asset.id,
    organizationId,
    title: asset.label,
    payload: asset,
  });

  return asset;
}

export async function deleteMediaAsset(id: string, organizationId = DEFAULT_ORG): Promise<boolean> {
  const asset = await getMediaAsset(id);
  if (!asset || asset.organizationId !== organizationId) return false;
  await saveMediaAsset({
    ...asset,
    id,
    organizationId,
    label: `[deleted] ${asset.label}`,
    url: '',
    tags: [...asset.tags, '_deleted'],
  });
  return true;
}
