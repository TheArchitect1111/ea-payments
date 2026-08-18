import type {
  CampaignArchitecture,
  CampaignAudienceSegment,
  CampaignLaunchWave,
  CampaignProductTrack,
  CampaignStrategy,
  SocialPlatform,
} from './types';

const SOCIAL_PLATFORMS = new Set<SocialPlatform>(['facebook', 'instagram', 'linkedin', 'x']);
const PRODUCT_STATUSES = new Set<CampaignProductTrack['status']>([
  'planned',
  'active',
  'paused',
  'complete',
]);
const WAVE_STATUSES = new Set<CampaignLaunchWave['status']>(['planned', 'active', 'complete']);

function clean(value: unknown, fallback = '', max = 300): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return (normalized || fallback).slice(0, max);
}

function slug(value: string, fallback: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || fallback;
}

function uniqueIds(values: unknown, allowed?: Set<string>): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(String).map((value) => value.trim()).filter(Boolean))]
    .filter((value) => !allowed || allowed.has(value))
    .slice(0, 50);
}

function uniqueId(requested: unknown, label: string, prefix: string, used: Set<string>): string {
  const base = slug(clean(requested, slug(label, prefix), 80), prefix);
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  return id;
}

function normalizePlatforms(values: unknown, fallback: SocialPlatform[]): SocialPlatform[] {
  const platforms = Array.isArray(values)
    ? values.filter((value): value is SocialPlatform => SOCIAL_PLATFORMS.has(value as SocialPlatform))
    : [];
  return platforms.length ? [...new Set(platforms)] : fallback;
}

export function createSingleCampaignArchitecture(input: {
  masterName: string;
  objective: string;
  audience: string;
  platforms: SocialPlatform[];
  ctaLabel: string;
  ctaUrl?: string;
}): CampaignArchitecture {
  return {
    mode: 'single',
    masterName: input.masterName,
    masterObjective: input.objective,
    defaultCallToAction: { label: input.ctaLabel, url: input.ctaUrl },
    audiences: [{ id: 'primary-audience', name: input.audience, channels: input.platforms }],
    products: [{
      id: 'primary-offer',
      name: input.masterName,
      audienceIds: ['primary-audience'],
      callToAction: { label: input.ctaLabel, url: input.ctaUrl },
      status: 'active',
    }],
    waves: [{
      id: 'primary-launch',
      name: 'Primary launch',
      sequence: 1,
      objective: input.objective,
      productIds: ['primary-offer'],
      audienceIds: ['primary-audience'],
      status: 'active',
    }],
  };
}

export function normalizeCampaignArchitecture(
  input: Partial<CampaignArchitecture> | undefined,
  fallback: {
    title: string;
    objective: string;
    audience: string;
    platforms: SocialPlatform[];
    ctaLabel: string;
    ctaUrl?: string;
  },
): CampaignArchitecture {
  const standard = createSingleCampaignArchitecture({
    masterName: fallback.title,
    objective: fallback.objective,
    audience: fallback.audience,
    platforms: fallback.platforms,
    ctaLabel: fallback.ctaLabel,
    ctaUrl: fallback.ctaUrl,
  });
  if (!input || input.mode !== 'portfolio') return standard;

  const audienceIds = new Set<string>();
  const audiences: CampaignAudienceSegment[] = (Array.isArray(input.audiences) ? input.audiences : [])
    .slice(0, 25)
    .map((audience, index) => {
      const name = clean(audience?.name, `Audience ${index + 1}`, 120);
      return {
        id: uniqueId(audience?.id, name, `audience-${index + 1}`, audienceIds),
        name,
        need: clean(audience?.need, '', 300) || undefined,
        channels: normalizePlatforms(audience?.channels, fallback.platforms),
      };
    });
  if (!audiences.length) audiences.push(standard.audiences[0]);
  const allowedAudienceIds = new Set(audiences.map((audience) => audience.id));

  const productIds = new Set<string>();
  const products: CampaignProductTrack[] = (Array.isArray(input.products) ? input.products : [])
    .slice(0, 30)
    .map((product, index) => {
      const name = clean(product?.name, `Product ${index + 1}`, 120);
      const assignedAudiences = uniqueIds(product?.audienceIds, allowedAudienceIds);
      return {
        id: uniqueId(product?.id, name, `product-${index + 1}`, productIds),
        name,
        positioning: clean(product?.positioning, '', 500) || undefined,
        offer: clean(product?.offer, '', 300) || undefined,
        audienceIds: assignedAudiences.length ? assignedAudiences : [audiences[0].id],
        callToAction: {
          label: clean(product?.callToAction?.label, input.defaultCallToAction?.label || fallback.ctaLabel, 100),
          url: clean(product?.callToAction?.url, '', 1000) || undefined,
          conversionGoal: clean(product?.callToAction?.conversionGoal, '', 200) || undefined,
        },
        status: PRODUCT_STATUSES.has(product?.status as CampaignProductTrack['status'])
          ? product.status as CampaignProductTrack['status']
          : 'planned',
      };
    });
  if (!products.length) products.push(standard.products[0]);
  const allowedProductIds = new Set(products.map((product) => product.id));

  const waveIds = new Set<string>();
  const waves: CampaignLaunchWave[] = (Array.isArray(input.waves) ? input.waves : [])
    .slice(0, 30)
    .map((wave, index) => {
      const name = clean(wave?.name, `Launch wave ${index + 1}`, 120);
      const assignedProducts = uniqueIds(wave?.productIds, allowedProductIds);
      const assignedAudiences = uniqueIds(wave?.audienceIds, allowedAudienceIds);
      const sequence = Number(wave?.sequence);
      return {
        id: uniqueId(wave?.id, name, `wave-${index + 1}`, waveIds),
        name,
        sequence: Number.isInteger(sequence) && sequence > 0 ? sequence : index + 1,
        objective: clean(wave?.objective, '', 300) || undefined,
        startDate: clean(wave?.startDate, '', 20) || undefined,
        endDate: clean(wave?.endDate, '', 20) || undefined,
        productIds: assignedProducts.length ? assignedProducts : [products[0].id],
        audienceIds: assignedAudiences.length ? assignedAudiences : [audiences[0].id],
        status: WAVE_STATUSES.has(wave?.status as CampaignLaunchWave['status'])
          ? wave.status as CampaignLaunchWave['status']
          : 'planned',
      };
    })
    .sort((a, b) => a.sequence - b.sequence);
  if (!waves.length) {
    waves.push({
      id: 'portfolio-launch',
      name: 'Portfolio launch',
      sequence: 1,
      objective: fallback.objective,
      productIds: products.map((product) => product.id),
      audienceIds: audiences.map((audience) => audience.id),
      status: 'planned',
    });
  }

  return {
    mode: 'portfolio',
    masterName: clean(input.masterName, fallback.title, 160),
    masterObjective: clean(input.masterObjective, fallback.objective, 500),
    defaultCallToAction: {
      label: clean(input.defaultCallToAction?.label, fallback.ctaLabel, 100),
      url: clean(input.defaultCallToAction?.url, fallback.ctaUrl || '', 1000) || undefined,
      conversionGoal: clean(input.defaultCallToAction?.conversionGoal, '', 200) || undefined,
    },
    audiences,
    products,
    waves,
  };
}

export function architectureFallback(input: {
  title: string;
  strategy: CampaignStrategy;
  ctaLabel: string;
  ctaUrl?: string;
}) {
  return {
    title: input.title,
    objective: input.strategy.objective,
    audience: input.strategy.audience,
    platforms: input.strategy.platforms,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
  };
}
