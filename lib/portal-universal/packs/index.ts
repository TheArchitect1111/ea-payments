import type { IndustryPack, IndustryPackId } from '@/lib/portal-universal/industry-pack';
import { assertValidIndustryPack } from '@/lib/portal-universal/validate-pack';
import { EA_EXECUTIVE_PACK } from '@/lib/portal-universal/packs/ea-executive';
import { CTP_CLIENT_PACK } from '@/lib/portal-universal/packs/ctp-client';
import { REAL_ESTATE_PACK } from '@/lib/portal-universal/packs/real-estate';
import { WEBSITE_PORTAL_PACK } from '@/lib/portal-universal/packs/website-portal';
import { SAMPLE_PLACEHOLDER_PACK } from '@/lib/portal-universal/packs/sample-placeholder';
import { AMANDA_CATHERINE_PACK } from '@/lib/portal-universal/packs/amanda-catherine';

const RAW_PACKS = [
  EA_EXECUTIVE_PACK,
  CTP_CLIENT_PACK,
  WEBSITE_PORTAL_PACK,
  REAL_ESTATE_PACK,
  SAMPLE_PLACEHOLDER_PACK,
  AMANDA_CATHERINE_PACK,
] as const;

/** Validated registry — throws at module load if a pack is invalid. */
export const INDUSTRY_PACK_REGISTRY: Record<IndustryPackId, IndustryPack> = Object.fromEntries(
  RAW_PACKS.map((pack) => {
    const valid = assertValidIndustryPack(pack, { phase1Strict: true });
    return [valid.id, valid] as const;
  }),
);

export const DEFAULT_INDUSTRY_PACK_ID: IndustryPackId = 'ea-executive';

export function listIndustryPacks(): IndustryPack[] {
  return Object.values(INDUSTRY_PACK_REGISTRY);
}

export function getIndustryPack(id: IndustryPackId): IndustryPack | undefined {
  return INDUSTRY_PACK_REGISTRY[id];
}

export function requireIndustryPack(id: IndustryPackId): IndustryPack {
  const pack = getIndustryPack(id);
  if (!pack) {
    throw new Error(`Unknown IndustryPack id: ${id}`);
  }
  return pack;
}
