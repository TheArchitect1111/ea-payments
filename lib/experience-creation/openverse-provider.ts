/**
 * Openverse media discovery — provider behind EA media-search interface.
 * Official API: https://api.openverse.org
 * Never treat Openverse license metadata as infallible; never auto-publish.
 */
export type MediaLicenseClass =
  | 'public_domain'
  | 'creative_commons'
  | 'unclear'
  | 'unsupported';

export type MediaUsageStatus =
  | 'discovered'
  | 'preview_only'
  | 'publication_candidate'
  | 'approved'
  | 'rejected';

export type MediaSearchQuery = {
  subject?: string;
  organization?: string;
  location?: string;
  event?: string;
  theme?: string;
  storyConcept?: string;
  pageSize?: number;
};

export type DiscoveredMediaItem = {
  foreignIdentifier: string;
  title: string;
  creator: string | null;
  source: string;
  originalUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  license: string;
  licenseUrl: string | null;
  licenseVersion: string | null;
  licenseClass: MediaLicenseClass;
  attribution: string;
  provider: string;
  usageStatus: MediaUsageStatus;
  relevanceScore: number;
  rejectionReason?: string;
  licenseVerified: boolean;
  licenseVerificationNotes: string;
};

export type MediaSearchProvider = {
  id: string;
  search: (query: MediaSearchQuery) => Promise<DiscoveredMediaItem[]>;
};

const OPENVERSE_BASE = 'https://api.openverse.org/v1';

/** In-process cache (durable cache lives in ProjectContext media_brand_pack). */
const searchCache = new Map<string, { at: number; items: DiscoveredMediaItem[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

export function normalizeOpenverseLicense(
  license: string | null | undefined,
  licenseUrl?: string | null,
): { licenseClass: MediaLicenseClass; normalized: string } {
  const raw = (license || '').trim().toLowerCase();
  const url = (licenseUrl || '').toLowerCase();
  if (!raw && !url) return { licenseClass: 'unclear', normalized: 'unknown' };

  if (
    raw === 'pdm' ||
    raw === 'cc0' ||
    raw.includes('public domain') ||
    raw.includes('cc0') ||
    url.includes('/publicdomain/') ||
    url.includes('cc0')
  ) {
    return { licenseClass: 'public_domain', normalized: raw || 'public-domain' };
  }

  if (
    raw.startsWith('by') ||
    raw.includes('cc-by') ||
    raw === 'cc-by' ||
    url.includes('creativecommons.org')
  ) {
    // NC / ND still CC but publication may need extra review
    if (raw.includes('nc') || raw.includes('nd')) {
      return { licenseClass: 'creative_commons', normalized: raw };
    }
    return { licenseClass: 'creative_commons', normalized: raw };
  }

  if (raw.includes('copyright') || raw === 'all-rights-reserved') {
    return { licenseClass: 'unsupported', normalized: raw };
  }

  return { licenseClass: 'unclear', normalized: raw || 'unknown' };
}

function buildQueryString(query: MediaSearchQuery): string {
  const parts = [
    query.subject,
    query.organization,
    query.location,
    query.event,
    query.theme,
    query.storyConcept,
  ]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  return parts.join(' ').slice(0, 180) || 'documentary portrait';
}

function scoreRelevance(item: DiscoveredMediaItem, q: string): number {
  const hay = `${item.title} ${item.attribution} ${item.creator || ''}`.toLowerCase();
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .filter(
      (t) =>
        !['the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'over'].includes(t),
    );
  if (!tokens.length) return 0.4;
  const hits = tokens.filter((t) => hay.includes(t)).length;
  return Math.min(1, hits / Math.max(tokens.length, 1));
}

/** Reject Openverse hits with zero thematic token overlap. */
export function shouldRejectIrrelevant(
  item: DiscoveredMediaItem,
  thematicQuery: string,
): boolean {
  return scoreRelevance(item, thematicQuery) <= 0;
}

type OpenverseImageResult = {
  id: string;
  title?: string;
  url?: string;
  foreign_landing_url?: string;
  creator?: string | null;
  license?: string;
  license_version?: string | null;
  license_url?: string | null;
  attribution?: string;
  provider?: string;
  source?: string;
  thumbnail?: string | null;
  width?: number | null;
  height?: number | null;
  mature?: boolean;
};

/**
 * Soft license verification: confirm license_url host looks like Creative Commons / Wikimedia.
 * Never upgrades unclear → approved.
 */
export function softVerifyLicense(item: {
  licenseUrl: string | null;
  licenseClass: MediaLicenseClass;
  foreignLandingUrl?: string;
}): { verified: boolean; notes: string } {
  if (item.licenseClass === 'unsupported' || item.licenseClass === 'unclear') {
    return {
      verified: false,
      notes: 'License class unclear or unsupported — requires human review before publication.',
    };
  }
  const url = (item.licenseUrl || '').toLowerCase();
  if (!url) {
    return {
      verified: false,
      notes: 'Missing license URL — Openverse metadata incomplete; treat as unverified.',
    };
  }
  if (url.includes('creativecommons.org') || url.includes('creativecommons.org/publicdomain')) {
    return {
      verified: true,
      notes: 'License URL points at Creative Commons / public-domain deed (metadata still not infallible).',
    };
  }
  return {
    verified: false,
    notes: 'License URL host not recognized — do not auto-approve.',
  };
}

export async function searchOpenverseImages(
  query: MediaSearchQuery,
): Promise<DiscoveredMediaItem[]> {
  const primary = buildQueryString(query);
  const fallbacks = [
    primary,
    [query.organization, query.theme].filter(Boolean).join(' '),
    [query.theme, query.location, query.event].filter(Boolean).join(' '),
    query.theme || '',
    query.storyConcept?.split(/\s+/).slice(0, 6).join(' ') || '',
  ]
    .map((q) => q.trim())
    .filter((q, i, arr) => q.length >= 3 && arr.indexOf(q) === i);

  const pageSize = Math.min(Math.max(query.pageSize || 8, 1), 20);
  const all: DiscoveredMediaItem[] = [];
  const seen = new Set<string>();

  for (const q of fallbacks) {
    const batch = await searchOpenverseOnce(q, pageSize);
    for (const item of batch) {
      const key = item.originalUrl.split('?')[0]!.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const thematic = [query.theme, query.organization, query.location, query.event]
        .filter(Boolean)
        .join(' ');
      item.relevanceScore = Math.max(
        item.relevanceScore,
        scoreRelevance(item, thematic || primary),
      );
      if (thematic && shouldRejectIrrelevant(item, thematic)) {
        item.usageStatus = 'rejected';
        item.rejectionReason = 'Irrelevant to subject theme/organization/location.';
      }
      all.push(item);
    }
    if (all.filter((i) => i.usageStatus !== 'rejected').length >= Math.min(pageSize, 6)) break;
  }

  return all.slice(0, pageSize * 2);
}

async function searchOpenverseOnce(
  q: string,
  pageSize: number,
): Promise<DiscoveredMediaItem[]> {
  const cacheKey = `${q}|${pageSize}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.items;

  const params = new URLSearchParams({
    q,
    page_size: String(pageSize),
    mature: 'false',
  });

  let response: Response;
  try {
    response = await fetch(`${OPENVERSE_BASE}/images/?${params}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'EfficiencyArchitects-ECE/1.0 (media discovery; respect rate limits)',
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    throw new Error(
      `Openverse unavailable: ${err instanceof Error ? err.message : 'network error'}`,
    );
  }

  if (response.status === 429) {
    throw new Error('Openverse rate limit exceeded — retry later; no stock substitution.');
  }
  if (!response.ok) {
    throw new Error(`Openverse search failed (${response.status})`);
  }

  const body = (await response.json()) as { results?: OpenverseImageResult[] };
  const items: DiscoveredMediaItem[] = [];
  const seen = new Set<string>();

  for (const row of body.results || []) {
    const originalUrl = (row.url || '').trim();
    const foreignId = (row.id || '').trim();
    if (!originalUrl || !foreignId) continue;
    const dedupe = originalUrl.split('?')[0]!.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    if (row.mature) continue;

    const { licenseClass, normalized } = normalizeOpenverseLicense(row.license, row.license_url);
    const attribution =
      row.attribution?.trim() ||
      `"${row.title || 'Untitled'}"${row.creator ? ` by ${row.creator}` : ''} — ${normalized}`;

    const soft = softVerifyLicense({
      licenseUrl: row.license_url || null,
      licenseClass,
      foreignLandingUrl: row.foreign_landing_url,
    });

    let usageStatus: MediaUsageStatus = 'discovered';
    let rejectionReason: string | undefined;
    if (licenseClass === 'unsupported') {
      usageStatus = 'rejected';
      rejectionReason = 'Unsupported license for EA media usage gate.';
    } else if (licenseClass === 'unclear') {
      usageStatus = 'preview_only';
    } else {
      usageStatus = 'preview_only'; // never auto publication_candidate without human gate
    }

    const item: DiscoveredMediaItem = {
      foreignIdentifier: foreignId,
      title: row.title?.trim() || 'Untitled',
      creator: row.creator || null,
      source: row.source || row.provider || 'openverse',
      originalUrl,
      thumbnailUrl: row.thumbnail || null,
      width: row.width ?? null,
      height: row.height ?? null,
      license: normalized,
      licenseUrl: row.license_url || null,
      licenseVersion: row.license_version || null,
      licenseClass,
      attribution,
      provider: 'openverse',
      usageStatus,
      relevanceScore: 0,
      rejectionReason,
      licenseVerified: soft.verified,
      licenseVerificationNotes: soft.notes,
    };
    item.relevanceScore = scoreRelevance(item, q);
    // Keep low-relevance as preview_only with notes — caller / human gate rejects for publish.
    if (item.relevanceScore < 0.2 && item.usageStatus !== 'rejected') {
      item.licenseVerificationNotes = `${item.licenseVerificationNotes} Low lexical relevance (${item.relevanceScore}); review before section assignment.`;
    }
    items.push(item);
  }

  searchCache.set(cacheKey, { at: Date.now(), items });
  return items;
}

export const OpenverseMediaProvider: MediaSearchProvider = {
  id: 'openverse',
  search: searchOpenverseImages,
};

/** EA media-usage gate: publication requires approved + verified-ish license. */
export function canPublishMediaAsset(input: {
  usageStatus: MediaUsageStatus;
  licenseClass: MediaLicenseClass;
  licenseVerified: boolean;
  publicationEligible?: boolean;
}): { ok: boolean; reason?: string } {
  if (input.usageStatus !== 'approved') {
    return { ok: false, reason: 'Asset is not human-approved.' };
  }
  if (!input.publicationEligible) {
    return { ok: false, reason: 'publicationEligible is false.' };
  }
  if (input.licenseClass === 'unsupported' || input.licenseClass === 'unclear') {
    return { ok: false, reason: 'License not acceptable for publication.' };
  }
  if (!input.licenseVerified) {
    return { ok: false, reason: 'License not verified against a trusted deed URL.' };
  }
  return { ok: true };
}
