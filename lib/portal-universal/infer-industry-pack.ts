/**
 * Infer IndustryPack id from sector / org name hints at fulfillment time.
 */
const REAL_ESTATE_KEYWORDS = [
  'realtor',
  'real estate',
  'realty',
  'brokerage',
  'broker',
  'listing',
  'mls',
];

export function inferIndustryPackId(sectorOrName: string | undefined | null): string | undefined {
  const raw = (sectorOrName ?? '').trim().toLowerCase();
  if (!raw) return undefined;

  if (REAL_ESTATE_KEYWORDS.some((kw) => raw.includes(kw))) {
    return 'real-estate';
  }

  return undefined;
}

/** Commerce offer / package hints → IndustryPack id (non–real-estate website portal). */
export function inferIndustryPackFromCommerce(input: {
  commerceOfferId?: string | null;
  packagePurchased?: string | null;
}): string | undefined {
  const offer = (input.commerceOfferId ?? '').trim().toLowerCase();
  const pkg = (input.packagePurchased ?? '').trim().toLowerCase();
  if (
    offer === 'website_portal_starter' ||
    pkg.includes('website + portal') ||
    pkg.includes('website portal')
  ) {
    return 'website-portal';
  }
  return undefined;
}

export function orgHintsLookLikeRealEstate(input: {
  name?: string;
  platformClientId?: string;
  industry?: string;
}): boolean {
  const combined = [input.name, input.platformClientId, input.industry].filter(Boolean).join(' ');
  return inferIndustryPackId(combined) === 'real-estate';
}
