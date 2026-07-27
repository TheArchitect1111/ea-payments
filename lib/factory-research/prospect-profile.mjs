/**
 * Pure identity/evidence helpers for the Name-to-Profile research provider.
 * Network access lives in prospect-profile-provider.ts.
 */

const SOCIAL_HOSTS = new Map([
  ['linkedin.com', 'linkedin'],
  ['instagram.com', 'instagram'],
  ['facebook.com', 'facebook'],
  ['youtube.com', 'youtube'],
  ['youtu.be', 'youtube'],
  ['tiktok.com', 'tiktok'],
  ['x.com', 'x'],
  ['twitter.com', 'x'],
  ['threads.net', 'threads'],
]);

const DIRECTORY_HOST_HINTS = [
  'wikipedia.org',
  'crunchbase.com',
  'zoominfo.com',
  'bloomberg.com',
  'imdb.com',
  'allmusic.com',
];

const PRESS_HOST_HINTS = [
  'apnews.com',
  'reuters.com',
  'forbes.com',
  'entrepreneur.com',
  'inc.com',
  'fastcompany.com',
  'medium.com',
  'substack.com',
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value) {
  return [...new Set(normalize(value).split(/\s+/).filter((item) => item.length > 1))];
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function socialNetworkFor(hostname) {
  for (const [host, network] of SOCIAL_HOSTS) {
    if (hostname === host || hostname.endsWith(`.${host}`)) return network;
  }
  return null;
}

function overlapScore(nameTokens, haystack) {
  if (!nameTokens.length) return 0;
  const blob = normalize(haystack);
  const hits = nameTokens.filter((token) => blob.includes(token)).length;
  return hits / nameTokens.length;
}

export function classifyPublicSource(url) {
  const hostname = hostnameOf(url);
  if (!hostname) return 'unknown';
  if (socialNetworkFor(hostname)) return 'social';
  if (DIRECTORY_HOST_HINTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    return 'directory';
  }
  if (PRESS_HOST_HINTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    return 'press';
  }
  return 'website';
}

export function scoreIdentityCandidate(candidate, input = {}) {
  const name = String(input.name || '').trim();
  const context = [input.context, input.industry, input.location].filter(Boolean).join(' ');
  const nameTokens = tokens(name);
  const title = String(candidate?.title || '');
  const description = String(candidate?.description || candidate?.snippet || '');
  const url = String(candidate?.url || '');
  const hostname = hostnameOf(url);
  const sourceType = classifyPublicSource(url);
  const reasons = [];

  const titleOverlap = overlapScore(nameTokens, title);
  const bodyOverlap = overlapScore(nameTokens, `${description} ${hostname.replace(/\./g, ' ')}`);
  const contextTokens = tokens(context);
  const contextOverlap = contextTokens.length
    ? overlapScore(contextTokens, `${title} ${description} ${hostname}`)
    : 0;

  let score = titleOverlap * 0.52 + bodyOverlap * 0.23 + contextOverlap * 0.15;
  if (titleOverlap === 1) {
    score += 0.08;
    reasons.push('full_name_in_title');
  } else if (titleOverlap >= 0.5) {
    reasons.push('partial_name_in_title');
  }
  if (sourceType === 'social') {
    score += 0.04;
    reasons.push('public_social_profile');
  }
  if (sourceType === 'directory' || sourceType === 'press') {
    score += 0.03;
    reasons.push(`public_${sourceType}_source`);
  }
  if (contextOverlap >= 0.5) reasons.push('context_match');

  score = Math.max(0, Math.min(1, Math.round(score * 100) / 100));
  return {
    ...candidate,
    url,
    hostname,
    sourceType,
    identityScore: score,
    reasons,
  };
}

export function rankIdentityCandidates(candidates, input) {
  return (candidates || [])
    .map((candidate) => scoreIdentityCandidate(candidate, input))
    .filter((candidate) => candidate.url && candidate.hostname)
    .sort((a, b) => b.identityScore - a.identityScore)
    .slice(0, 12);
}

export function identityVerdict(ranked) {
  const first = ranked?.[0];
  const second = ranked?.[1];
  if (!first) {
    return {
      status: 'insufficient_evidence',
      confidence: 0,
      selectedUrl: null,
      reason: 'No public candidates were found.',
    };
  }
  const margin = first.identityScore - (second?.identityScore || 0);
  const confidence = Math.max(
    0,
    Math.min(1, Math.round((first.identityScore * 0.8 + Math.max(0, margin) * 0.2) * 100) / 100),
  );
  const status =
    first.identityScore >= 0.72 && margin >= 0.08
      ? 'resolved'
      : first.identityScore >= 0.48
        ? 'needs_confirmation'
        : 'insufficient_evidence';
  return {
    status,
    confidence,
    selectedUrl: status === 'insufficient_evidence' ? null : first.url,
    reason:
      status === 'resolved'
        ? 'A leading public identity has sufficient name/context evidence.'
        : status === 'needs_confirmation'
          ? 'Plausible public identity found, but another candidate may refer to the same name.'
          : 'Public results do not provide enough evidence to select an identity safely.',
  };
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function extractPublicAssets(pages, candidates) {
  const assets = [];
  for (const page of pages || []) {
    const sourceUrl = page.url;
    const imageUrls = [
      page.ogImage,
      ...(Array.isArray(page.imageUrls) ? page.imageUrls : []),
    ].filter(Boolean);
    for (const url of imageUrls) {
      assets.push({
        type: 'image',
        url,
        sourceUrl,
        usageStatus: 'permission_review_required',
      });
    }
  }
  for (const candidate of candidates || []) {
    if (candidate.sourceType !== 'social') continue;
    assets.push({
      type: 'social_profile',
      network: socialNetworkFor(candidate.hostname),
      url: candidate.url,
      sourceUrl: candidate.url,
      usageStatus: 'reference_only',
    });
  }
  return uniqueBy(assets, (asset) => `${asset.type}:${asset.url}`).slice(0, 30);
}

export function buildProspectProfileData(input) {
  const ranked = rankIdentityCandidates(input.candidates || [], {
    name: input.name,
    context: input.context,
    industry: input.industry,
    location: input.location,
  });
  const identity = input.searchConfigured
    ? identityVerdict(ranked)
    : {
        status: 'search_not_configured',
        confidence: 0,
        selectedUrl: input.knownUrl || null,
        reason: 'Public name search requires the existing EA OPENAI_API_KEY.',
      };

  const selected = ranked.find((candidate) => candidate.url === identity.selectedUrl) || ranked[0];
  const pages = Array.isArray(input.pages) ? input.pages : [];
  const citations = uniqueBy(
    [
      ...ranked.map((candidate) => ({
        url: candidate.url,
        title: candidate.title || candidate.hostname,
        sourceType: candidate.sourceType,
        identityScore: candidate.identityScore,
      })),
      ...pages.map((page) => ({
        url: page.url,
        title: page.title || page.url,
        sourceType: classifyPublicSource(page.url),
        identityScore: selected?.identityScore || 0,
      })),
    ],
    (item) => item.url,
  ).slice(0, 20);

  const summaries = uniqueBy(
    [
      ...ranked.map((candidate) => candidate.description).filter(Boolean),
      ...pages.map((page) => page.description || page.textPreview).filter(Boolean),
    ].map((text, index) => ({
      id: `summary-${index + 1}`,
      text: String(text).slice(0, 600),
    })),
    (item) => normalize(item.text),
  ).slice(0, 12);

  return {
    profileVersion: 1,
    subject: {
      submittedName: input.name,
      resolvedName: selected?.title || input.name,
      knownUrl: input.knownUrl || null,
      context: input.context || null,
      industry: input.industry || null,
      location: input.location || null,
    },
    identity,
    candidates: ranked,
    citations,
    evidence: summaries,
    assetInventory: extractPublicAssets(pages, ranked),
    coverage: {
      candidateCount: ranked.length,
      citationCount: citations.length,
      pageCount: pages.length,
      assetCount: extractPublicAssets(pages, ranked).length,
      searchConfigured: Boolean(input.searchConfigured),
    },
    publishingSafety: {
      publicFactsRequireCitation: true,
      imagesRequirePermissionReview: true,
      unsupportedClaimsAllowed: false,
      automaticProductionPublishAllowed: false,
    },
  };
}
