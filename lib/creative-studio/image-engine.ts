import { createHash } from 'crypto';
import { put } from '@vercel/blob';
import type { BrandProfile, CampaignBrief, CampaignImageSuggestion, CampaignResearch, CampaignStrategy } from './types';

type OpenverseImage = {
  id?: string;
  title?: string;
  url?: string;
  thumbnail?: string;
  creator?: string;
  creator_url?: string;
  foreign_landing_url?: string;
  license?: string;
  license_url?: string;
  source?: string;
};

function clean(value: unknown, max = 300): string {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function searchOpenverse(query: string): Promise<CampaignImageSuggestion[]> {
  const url = new URL('https://api.openverse.org/v1/images/');
  url.searchParams.set('q', query);
  url.searchParams.set('license', 'cc0,pdm');
  url.searchParams.set('page_size', '8');
  url.searchParams.set('mature', 'false');
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return [];
  const data = await response.json() as { results?: OpenverseImage[] };
  const checkedAt = new Date().toISOString();
  return (data.results || []).map((image, index) => {
    const original = clean(image.url, 1200);
    const thumbnail = clean(image.thumbnail, 1200) || original;
    const license = clean(image.license || 'public-domain').toUpperCase();
    return {
      id: clean(image.id) || `openverse-${index}`,
      title: clean(image.title) || 'Campaign image',
      url: original,
      thumbnailUrl: thumbnail,
      creator: clean(image.creator) || undefined,
      creatorUrl: clean(image.creator_url, 1200) || undefined,
      source: 'openverse' as const,
      sourceUrl: clean(image.foreign_landing_url, 1200) || undefined,
      license,
      licenseUrl: clean(image.license_url, 1200) || undefined,
      attribution: [clean(image.title), clean(image.creator), license].filter(Boolean).join(' — '),
      altText: clean(image.title) || `Visual related to ${query}`,
      query,
      rightsStatus: license === 'CC0' || license === 'PDM'
        ? 'public-domain-candidate' as const
        : 'license-review-required' as const,
      checkedAt,
    };
  }).filter((image) => image.url && image.thumbnailUrl);
}

async function generateFallbackImage(input: {
  query: string;
  brand: BrandProfile;
  brief: CampaignBrief;
  strategy: CampaignStrategy;
}): Promise<CampaignImageSuggestion | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!apiKey || !blobToken) return null;
  const prompt = [
    'Create one premium editorial campaign photograph with no text, logos, charts, UI, or watermarks.',
    `Organization: ${input.brand.organizationName}.`,
    `Audience: ${input.strategy.audience}.`,
    `Campaign: ${input.brief.title}.`,
    `Visual idea: ${input.query}.`,
    `Style: ${input.brand.photographyStyle || 'warm, human, natural light, art-directed, credible'}.`,
    'Avoid generic corporate stock-photo staging.',
  ].join(' ');
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-1', prompt, size: '1536x1024', quality: 'medium', n: 1 }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) return null;
  const data = await response.json() as { data?: Array<{ b64_json?: string; revised_prompt?: string }> };
  const encoded = data.data?.[0]?.b64_json;
  if (!encoded) return null;
  const buffer = Buffer.from(encoded, 'base64');
  const digest = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  const blob = await put(`amplifi/generated/${digest}.png`, buffer, {
    access: 'public',
    contentType: 'image/png',
    token: blobToken,
    addRandomSuffix: false,
  });
  const checkedAt = new Date().toISOString();
  return {
    id: `generated-${digest}`,
    title: `${input.brief.title} campaign image`,
    url: blob.url,
    thumbnailUrl: blob.url,
    source: 'generated',
    license: 'GENERATED',
    attribution: `Generated for ${input.brand.organizationName}`,
    altText: `Editorial campaign visual for ${input.brief.title}`,
    query: input.query,
    rightsStatus: 'generated',
    checkedAt,
  };
}

export async function createCampaignImages(input: {
  brief: CampaignBrief;
  strategy: CampaignStrategy;
  brand: BrandProfile;
  research: CampaignResearch;
}): Promise<CampaignImageSuggestion[]> {
  const sourceTerms = input.research.sources.slice(0, 2).map((source) => source.title).join(' ');
  const query = [
    input.strategy.contentPillars.slice(0, 2).join(' '),
    input.brief.title,
    sourceTerms,
  ].filter(Boolean).join(' ').slice(0, 260);

  try {
    const found = await searchOpenverse(query);
    if (found.length) return found.slice(0, 6);
  } catch {
    // Continue to the generated-image fallback.
  }

  try {
    const generated = await generateFallbackImage({ query, brand: input.brand, brief: input.brief, strategy: input.strategy });
    return generated ? [generated] : [];
  } catch {
    return [];
  }
}
