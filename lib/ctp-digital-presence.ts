/**
 * Lightweight digital presence audit for CTP (Phase 4).
 * Serverless-safe: HTML fetch + heuristic scoring (no Chrome/Lighthouse).
 * Includes social + Google Business Profile URL heuristics.
 * Never fails the CTP workflow — returns a generic evaluation when no URL exists.
 */

export type DigitalPresenceDimension =
  | 'website'
  | 'brandConsistency'
  | 'seo'
  | 'accessibility'
  | 'performance'
  | 'mobileExperience'
  | 'trustSignals'
  | 'conversionOptimization'
  | 'leadCapture'
  | 'messaging'
  | 'callsToAction'
  | 'navigation'
  | 'socialPresence'
  | 'googleBusinessProfile';

export type DigitalPresenceScores = Record<DigitalPresenceDimension, number>;

export type DigitalPresenceFinding = {
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
};

export type DigitalPresenceChannel = {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'x' | 'gbp' | 'other';
  url: string;
  reachable?: boolean;
};

export type DigitalPresenceAudit = {
  overallScore: number;
  scores: DigitalPresenceScores;
  findings: DigitalPresenceFinding[];
  impactEstimate: string;
  sourceUrl?: string;
  socialChannels?: DigitalPresenceChannel[];
  mode: 'live-audit' | 'generic-baseline';
  auditedAt: string;
};

const DIMENSION_LABELS: Record<DigitalPresenceDimension, string> = {
  website: 'Website',
  brandConsistency: 'Brand Consistency',
  seo: 'SEO',
  accessibility: 'Accessibility',
  performance: 'Performance',
  mobileExperience: 'Mobile Experience',
  trustSignals: 'Trust Signals',
  conversionOptimization: 'Conversion Optimization',
  leadCapture: 'Lead Capture',
  messaging: 'Messaging',
  callsToAction: 'Calls To Action',
  navigation: 'Navigation',
  socialPresence: 'Social Presence',
  googleBusinessProfile: 'Google Business Profile',
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function extractUrl(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const match = String(raw).match(/https?:\/\/[^\s<>"']+/i) || String(raw).match(/(?:www\.)[^\s<>"']+/i);
  if (!match) return undefined;
  let url = match[0];
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function average(scores: number[]): number {
  if (!scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function classifyChannel(url: string): DigitalPresenceChannel['platform'] {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();
  if (host.includes('facebook.com') || host.includes('fb.com')) return 'facebook';
  if (host.includes('instagram.com')) return 'instagram';
  if (host.includes('linkedin.com')) return 'linkedin';
  if (host.includes('tiktok.com')) return 'tiktok';
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('twitter.com') || host === 'x.com' || host.endsWith('.x.com')) return 'x';
  if (
    host.includes('business.google') ||
    host.includes('maps.google') ||
    host.includes('goo.gl/maps') ||
    host.includes('g.page') ||
    host.includes('maps.app.goo.gl')
  ) {
    return 'gbp';
  }
  return 'other';
}

/** Pull website + social/GBP URLs from free text / discovery answers. */
export function extractPresenceUrls(raw: unknown): {
  websiteUrl?: string;
  socialUrls: string[];
  gbpUrls: string[];
} {
  const blobs: string[] = [];
  if (typeof raw === 'string') blobs.push(raw);
  else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') blobs.push(item);
    }
  } else if (raw && typeof raw === 'object') {
    for (const value of Object.values(raw as Record<string, unknown>)) {
      if (typeof value === 'string') blobs.push(value);
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') blobs.push(item);
        }
      }
    }
  }

  const found = new Set<string>();
  const pattern = /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/gi;
  for (const blob of blobs) {
    const matches = blob.match(pattern) ?? [];
    for (const match of matches) {
      const url = extractUrl(match);
      if (url) found.add(url);
    }
  }

  const socialUrls: string[] = [];
  const gbpUrls: string[] = [];
  let websiteUrl: string | undefined;

  for (const url of found) {
    const platform = classifyChannel(url);
    if (platform === 'gbp') gbpUrls.push(url);
    else if (platform === 'other') {
      if (!websiteUrl) websiteUrl = url;
    } else {
      socialUrls.push(url);
    }
  }

  return { websiteUrl, socialUrls, gbpUrls };
}

async function probeUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'EfficiencyArchitects-CTP-Audit/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function scoreSocialAndGbp(input: {
  socialUrls?: string[];
  gbpUrls?: string[];
  html?: string;
}): Promise<{
  socialScore: number;
  gbpScore: number;
  channels: DigitalPresenceChannel[];
  findings: DigitalPresenceFinding[];
}> {
  const findings: DigitalPresenceFinding[] = [];
  const channels: DigitalPresenceChannel[] = [];
  const socialUrls = [...new Set(input.socialUrls ?? [])].slice(0, 6);
  const gbpUrls = [...new Set(input.gbpUrls ?? [])].slice(0, 3);

  const html = (input.html ?? '').toLowerCase();
  const htmlSocialHints = [
    html.includes('facebook.com'),
    html.includes('instagram.com'),
    html.includes('linkedin.com'),
    html.includes('tiktok.com'),
    html.includes('youtube.com'),
  ].filter(Boolean).length;

  for (const url of socialUrls) {
    const reachable = await probeUrl(url);
    channels.push({ platform: classifyChannel(url), url, reachable });
  }
  for (const url of gbpUrls) {
    const reachable = await probeUrl(url);
    channels.push({ platform: 'gbp', url, reachable });
  }

  const reachableSocial = channels.filter((c) => c.platform !== 'gbp' && c.reachable).length;
  const socialPlatforms = new Set(channels.filter((c) => c.platform !== 'gbp').map((c) => c.platform));
  let socialScore = 28;
  socialScore += Math.min(socialPlatforms.size, 3) * 14;
  socialScore += Math.min(reachableSocial, 3) * 8;
  socialScore += Math.min(htmlSocialHints, 3) * 6;
  if (!socialUrls.length && htmlSocialHints === 0) {
    findings.push({
      title: 'Social presence weak or missing',
      detail: 'No Facebook, Instagram, LinkedIn, or similar profile URL was detected.',
      severity: 'warning',
    });
    socialScore = 30;
  } else if (reachableSocial === 0 && socialUrls.length) {
    findings.push({
      title: 'Social profiles hard to reach',
      detail: 'Social URLs were supplied but could not be confirmed as reachable.',
      severity: 'warning',
    });
  } else if (socialPlatforms.size === 1) {
    findings.push({
      title: 'Thin social footprint',
      detail: 'Only one social channel was detected. Multi-channel presence usually improves discovery.',
      severity: 'info',
    });
  } else {
    findings.push({
      title: 'Social channels detected',
      detail: `${socialPlatforms.size} social platform(s) identified for the public presence audit.`,
      severity: 'info',
    });
  }

  const gbpReachable = channels.some((c) => c.platform === 'gbp' && c.reachable);
  const gbpInHtml =
    html.includes('maps.google') ||
    html.includes('g.page') ||
    html.includes('business.google') ||
    html.includes('google.com/maps');
  let gbpScore = 32;
  if (gbpUrls.length || gbpInHtml) {
    gbpScore = gbpReachable || gbpInHtml ? 78 : 55;
    findings.push({
      title: gbpReachable || gbpInHtml ? 'Google Business Profile signal found' : 'GBP URL unconfirmed',
      detail: gbpReachable || gbpInHtml
        ? 'A Google Maps / Business Profile reference was detected — strong for local discovery.'
        : 'A GBP-style URL was provided but could not be confirmed live.',
      severity: gbpReachable || gbpInHtml ? 'info' : 'warning',
    });
  } else {
    findings.push({
      title: 'No Google Business Profile detected',
      detail: 'Local search visibility often hinges on an active Google Business Profile.',
      severity: 'warning',
    });
  }

  return {
    socialScore: clampScore(socialScore),
    gbpScore: clampScore(gbpScore),
    channels,
    findings,
  };
}

export function buildGenericDigitalPresenceAudit(businessName?: string): DigitalPresenceAudit {
  const name = businessName?.trim() || 'this organization';
  const baseline = 42;
  const scores = Object.fromEntries(
    (Object.keys(DIMENSION_LABELS) as DigitalPresenceDimension[]).map((key) => [key, baseline]),
  ) as DigitalPresenceScores;

  return {
    overallScore: baseline,
    scores,
    findings: [
      {
        title: 'No public digital presence supplied',
        detail: `We did not receive a current website or social URL for ${name}. Establishing a professional presence is usually the highest-leverage first step.`,
        severity: 'warning',
      },
      {
        title: 'Missing clear offer destination',
        detail: 'Without a live site, prospects have nowhere to understand the offer or take a next step.',
        severity: 'critical',
      },
      {
        title: 'Lead capture not established',
        detail: 'There is no owned channel yet to capture interest and follow up with confidence.',
        severity: 'warning',
      },
      {
        title: 'Trust signals unavailable',
        detail: 'Proof, reviews, and brand consistency cannot be evaluated until a public surface exists.',
        severity: 'info',
      },
    ],
    impactEstimate:
      'We estimate the lack of a professional digital presence may be costing approximately 15–30 qualified inquiries per month, depending on traffic and offer clarity.',
    mode: 'generic-baseline',
    auditedAt: new Date().toISOString(),
  };
}

function scoreFromHtml(html: string, finalUrl: string, elapsedMs: number): {
  scores: DigitalPresenceScores;
  findings: DigitalPresenceFinding[];
} {
  const lower = html.toLowerCase();
  const findings: DigitalPresenceFinding[] = [];

  const hasTitle = /<title[^>]*>[^<]{3,}<\/title>/i.test(html);
  const hasMetaDesc = /name=["']description["']/i.test(html);
  const hasViewport = /name=["']viewport["']/i.test(html);
  const hasOg = /property=["']og:/i.test(html);
  const hasH1 = /<h1[\s>]/i.test(html);
  const hasNav = /<nav[\s>]/i.test(html) || /role=["']navigation["']/i.test(html);
  const hasCta =
    /href=["'][^"']*(contact|book|schedule|start|buy|join|get-started|demo)[^"']*["']/i.test(html) ||
    />\s*(get started|book|contact us|schedule|learn more|start now)\s*</i.test(html);
  const hasForm = /<form[\s>]/i.test(html) || /type=["']email["']/i.test(html);
  const hasHttps = finalUrl.startsWith('https://');
  const hasTrust =
    /testimonial|review|trusted by|as seen|certified|guarantee|privacy/i.test(lower);
  const hasA11yHints =
    /alt=["'][^"']+["']/i.test(html) || /aria-[a-z]+=/i.test(html) || /role=["']/i.test(html);
  const htmlBytes = Buffer.byteLength(html, 'utf8');
  const performance =
    elapsedMs < 1200 && htmlBytes < 500_000 ? 78 : elapsedMs < 2500 && htmlBytes < 1_200_000 ? 62 : 44;

  if (!hasTitle) {
    findings.push({
      title: 'Weak or missing page title',
      detail: 'Search and browser tabs need a clear title to establish relevance.',
      severity: 'warning',
    });
  }
  if (!hasMetaDesc) {
    findings.push({
      title: 'Weak SEO foundation',
      detail: 'No meta description detected — search snippets and positioning will underperform.',
      severity: 'warning',
    });
  }
  if (!hasCta) {
    findings.push({
      title: 'No clear call to action',
      detail: 'Visitors may not know the primary next step after landing on the page.',
      severity: 'critical',
    });
  }
  if (!hasForm) {
    findings.push({
      title: 'Poor lead capture',
      detail: 'No obvious form or email capture path was detected on the homepage.',
      severity: 'warning',
    });
  }
  if (!hasTrust) {
    findings.push({
      title: 'Missing trust indicators',
      detail: 'Testimonials, reviews, or proof language were not clearly present.',
      severity: 'info',
    });
  }
  if (!hasViewport) {
    findings.push({
      title: 'Mobile experience risk',
      detail: 'Viewport meta tag missing — mobile rendering may be compromised.',
      severity: 'warning',
    });
  }
  if (performance < 55) {
    findings.push({
      title: 'Website loads slowly',
      detail: `Initial HTML response took ~${Math.round(elapsedMs)}ms with a large document footprint.`,
      severity: 'warning',
    });
  }
  if (!hasNav) {
    findings.push({
      title: 'Navigation confusing or unclear',
      detail: 'A clear navigation landmark was not detected.',
      severity: 'info',
    });
  }
  if (!hasHttps) {
    findings.push({
      title: 'Insecure connection',
      detail: 'Site is not served over HTTPS.',
      severity: 'critical',
    });
  }
  if (findings.length === 0) {
    findings.push({
      title: 'Solid baseline with room to sharpen conversion',
      detail: 'Core signals look present. Focus next on tighter messaging and proof.',
      severity: 'info',
    });
  }

  const scores: DigitalPresenceScores = {
    website: clampScore((hasTitle ? 70 : 35) + (hasHttps ? 20 : 0) + (hasH1 ? 10 : 0)),
    brandConsistency: clampScore((hasOg ? 65 : 45) + (hasTitle ? 15 : 0)),
    seo: clampScore((hasTitle ? 30 : 10) + (hasMetaDesc ? 30 : 5) + (hasOg ? 20 : 5) + (hasH1 ? 15 : 0)),
    accessibility: clampScore(hasA11yHints ? 68 : 40),
    performance: clampScore(performance),
    mobileExperience: clampScore(hasViewport ? 74 : 38),
    trustSignals: clampScore(hasTrust ? 72 : 40),
    conversionOptimization: clampScore((hasCta ? 40 : 15) + (hasForm ? 30 : 10) + (hasTrust ? 15 : 0)),
    leadCapture: clampScore(hasForm ? 76 : 34),
    messaging: clampScore((hasH1 ? 55 : 30) + (hasMetaDesc ? 20 : 5) + (hasCta ? 15 : 0)),
    callsToAction: clampScore(hasCta ? 78 : 32),
    navigation: clampScore(hasNav ? 74 : 42),
    socialPresence: 40,
    googleBusinessProfile: 40,
  };

  return { scores, findings: findings.slice(0, 8) };
}

export async function auditDigitalPresence(input: {
  url?: string | null;
  businessName?: string;
  socialUrls?: string[] | null;
  gbpUrls?: string[] | null;
  discoveryAnswers?: Record<string, unknown> | null;
}): Promise<DigitalPresenceAudit> {
  const extracted = extractPresenceUrls({
    url: input.url,
    ...(input.discoveryAnswers ?? {}),
    social: input.socialUrls,
    gbp: input.gbpUrls,
  });
  const sourceUrl = extractUrl(input.url ?? undefined) ?? extracted.websiteUrl;
  const socialUrls = [...(input.socialUrls ?? []), ...extracted.socialUrls];
  const gbpUrls = [...(input.gbpUrls ?? []), ...extracted.gbpUrls];

  if (!sourceUrl && !socialUrls.length && !gbpUrls.length) {
    return buildGenericDigitalPresenceAudit(input.businessName);
  }

  if (!sourceUrl) {
    const social = await scoreSocialAndGbp({ socialUrls, gbpUrls });
    const scores = Object.fromEntries(
      (Object.keys(DIMENSION_LABELS) as DigitalPresenceDimension[]).map((key) => [key, 38]),
    ) as DigitalPresenceScores;
    scores.socialPresence = social.socialScore;
    scores.googleBusinessProfile = social.gbpScore;
    scores.website = 34;
    const overallScore = clampScore(average(Object.values(scores)));
    return {
      overallScore,
      scores,
      findings: [
        {
          title: 'No website URL — social/GBP only',
          detail: 'Auditing public social and Google Business signals without a primary website.',
          severity: 'warning',
        },
        ...social.findings,
      ].slice(0, 10),
      impactEstimate:
        'Without a primary website, social and local listings carry the brand — conversion and trust usually underperform.',
      socialChannels: social.channels,
      mode: 'live-audit',
      auditedAt: new Date().toISOString(),
    };
  }

  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(sourceUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'EfficiencyArchitects-CTP-Audit/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);
    const elapsedMs = Date.now() - started;
    const html = (await res.text()).slice(0, 750_000);
    if (!res.ok || !html.trim()) {
      const generic = buildGenericDigitalPresenceAudit(input.businessName);
      const social = await scoreSocialAndGbp({ socialUrls, gbpUrls });
      return {
        ...generic,
        sourceUrl,
        scores: {
          ...generic.scores,
          socialPresence: social.socialScore,
          googleBusinessProfile: social.gbpScore,
        },
        findings: [
          {
            title: 'Website unreachable or empty',
            detail: `We could not audit ${sourceUrl} (HTTP ${res.status}). Treating this as a weak public presence.`,
            severity: 'critical',
          },
          ...social.findings,
          ...generic.findings.slice(0, 2),
        ].slice(0, 10),
        socialChannels: social.channels,
        mode: 'live-audit',
        overallScore: 28,
      };
    }

    const { scores, findings } = scoreFromHtml(html, res.url || sourceUrl, elapsedMs);
    const social = await scoreSocialAndGbp({ socialUrls, gbpUrls, html });
    scores.socialPresence = social.socialScore;
    scores.googleBusinessProfile = social.gbpScore;
    const overallScore = clampScore(average(Object.values(scores)));
    const impactLow = overallScore >= 70 ? 5 : overallScore >= 50 ? 10 : 15;
    const impactHigh = overallScore >= 70 ? 12 : overallScore >= 50 ? 20 : 30;

    return {
      overallScore,
      scores,
      findings: [...findings, ...social.findings].slice(0, 12),
      impactEstimate: `We estimate your current digital presence may be costing approximately ${impactLow}–${impactHigh} qualified inquiries per month.`,
      sourceUrl: res.url || sourceUrl,
      socialChannels: social.channels,
      mode: 'live-audit',
      auditedAt: new Date().toISOString(),
    };
  } catch {
    const generic = buildGenericDigitalPresenceAudit(input.businessName);
    const social = await scoreSocialAndGbp({ socialUrls, gbpUrls });
    return {
      ...generic,
      sourceUrl,
      scores: {
        ...generic.scores,
        socialPresence: social.socialScore,
        googleBusinessProfile: social.gbpScore,
      },
      findings: [
        {
          title: 'Could not reach the provided URL',
          detail: `The audit could not load ${sourceUrl}. Continuing with a baseline evaluation so the workflow does not stall.`,
          severity: 'warning',
        },
        ...social.findings,
        ...generic.findings.slice(0, 2),
      ].slice(0, 10),
      socialChannels: social.channels,
      mode: 'live-audit',
      overallScore: 30,
    };
  }
}

export function digitalPresenceSummaryLine(audit: DigitalPresenceAudit): string {
  return `Digital Presence Score ${audit.overallScore}/100${audit.sourceUrl ? ` · ${audit.sourceUrl}` : ''}`;
}

export { DIMENSION_LABELS };
