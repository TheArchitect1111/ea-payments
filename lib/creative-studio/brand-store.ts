import { getDefaultBrandProfile } from './brand-profile';
import { loadStudioRecord, saveStudioRecord } from './persistence';
import type { BrandProfile } from './types';

function orgId(): string {
  return process.env.EA_INTERNAL_ORG_ID ?? 'ea';
}

export async function getBrandProfile(organizationId = orgId()): Promise<BrandProfile> {
  const stored = await loadStudioRecord<BrandProfile>('brand', organizationId);
  if (stored) return { ...stored, organizationId };
  return getDefaultBrandProfile(organizationId);
}

export async function saveBrandProfile(profile: BrandProfile): Promise<BrandProfile> {
  const updated: BrandProfile = {
    ...profile,
    organizationId: profile.organizationId || orgId(),
    updatedAt: new Date().toISOString(),
  };
  await saveStudioRecord({
    recordType: 'brand',
    id: updated.organizationId,
    organizationId: updated.organizationId,
    payload: updated,
    title: updated.organizationName,
  });
  return updated;
}
