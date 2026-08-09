import type { Organization } from '@/lib/organizations';
import type { IndustryPack, IndustryPackId } from '@/lib/portal-universal/industry-pack';
import { orgHintsLookLikeRealEstate, inferIndustryPackFromCommerce } from '@/lib/portal-universal/infer-industry-pack';
import {
  DEFAULT_INDUSTRY_PACK_ID,
  getIndustryPack,
  INDUSTRY_PACK_REGISTRY,
} from '@/lib/portal-universal/packs';

export type ResolvePackForOrgInput = {
  organization?: Organization | null;
  portalSlug: string;
  /** When true (CTP Client Experience), prefer ctp-client unless org pins another pack */
  preferClientExperience?: boolean;
  /** Optional explicit override (tests / env) */
  industryPackId?: string | null;
  commerceOfferId?: string | null;
  packagePurchased?: string | null;
};

function packFromEnvSlug(slug: string): IndustryPackId | undefined {
  const raw = process.env.INDUSTRY_PACK_BY_SLUG_JSON?.trim();
  if (!raw) return undefined;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    const id = map[slug.trim().toLowerCase()]?.trim();
    if (id && getIndustryPack(id)) return id;
  } catch {
    console.warn('[portal-universal] INDUSTRY_PACK_BY_SLUG_JSON parse failed');
  }
  return undefined;
}

function packByLegacyPlatformClientId(platformClientId?: string): IndustryPack | undefined {
  if (!platformClientId) return undefined;
  return Object.values(INDUSTRY_PACK_REGISTRY).find(
    (pack) => pack.legacyPlatformClientId === platformClientId,
  );
}

/**
 * Select IndustryPack for a portal org.
 * Priority: explicit id → env slug map → org.industryPackId → legacy platformClientId →
 * CTP client preference → ea-executive.
 */
export function resolvePackForOrg(input: ResolvePackForOrgInput): IndustryPack {
  const tryId = (id: string | null | undefined): IndustryPack | undefined => {
    const trimmed = id?.trim();
    if (!trimmed) return undefined;
    const pack = getIndustryPack(trimmed);
    if (!pack) {
      console.warn(`[portal-universal] unknown industryPackId "${trimmed}" — ignoring`);
    }
    return pack;
  };

  const fromExplicit = tryId(input.industryPackId);
  if (fromExplicit) return fromExplicit;

  if (input.portalSlug.trim().toLowerCase().startsWith('amanda-catherine')) {
    const amanda = getIndustryPack('amanda-catherine');
    if (amanda) return amanda;
  }

  const fromEnv = tryId(packFromEnvSlug(input.portalSlug));
  if (fromEnv) return fromEnv;

  const fromOrg = tryId(input.organization?.industryPackId);
  if (fromOrg) return fromOrg;

  const fromLegacy = packByLegacyPlatformClientId(input.organization?.platformClientId);
  if (fromLegacy) return fromLegacy;

  if (
    orgHintsLookLikeRealEstate({
      name: input.organization?.name,
      platformClientId: input.organization?.platformClientId,
      industry: input.organization?.industry,
    })
  ) {
    const realEstate = getIndustryPack('real-estate');
    if (realEstate) return realEstate;
  }

  if (input.preferClientExperience) {
    const fromCommerce = inferIndustryPackFromCommerce({
      commerceOfferId: input.commerceOfferId,
      packagePurchased: input.packagePurchased,
    });
    // website-portal pack when commerce offer is website_portal_starter (non–real-estate).
    const websitePortal = tryId(fromCommerce);
    if (websitePortal) return websitePortal;

    const ctp = getIndustryPack('ctp-client');
    if (ctp) return ctp;
  }

  return getIndustryPack(DEFAULT_INDUSTRY_PACK_ID)!;
}
