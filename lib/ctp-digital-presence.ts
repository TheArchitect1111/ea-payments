/**
 * Lightweight digital presence audit for CTP (Phase 4).
 * Serverless-safe: HTML fetch + heuristic scoring (no Chrome/Lighthouse).
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
  | 'navigation';

export type DigitalPresenceScores = Record<DigitalPresenceDimension, number>;

export type DigitalPresenceFinding = {
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
};

export type DigitalPresenceAudit = {
  overallScore: number;
  scores: DigitalPresenceScores;
  findings: DigitalPresenceFinding[];
  impactEstimate: string;
  sourceUrl?: string;
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
  };

  return { scores, findings: findings.slice(0, 8) };
}

export async function auditDigitalPresence(input: {
  url?: string | null;
  businessName?: string;
}): Promise<DigitalPresenceAudit> {
  const sourceUrl = extractUrl(input.url ?? undefined);
  if (!sourceUrl) {
    return buildGenericDigitalPresenceAudit(input.businessName);
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
      return {
        ...generic,
        sourceUrl,
        findings: [
          {
            title: 'Website unreachable or empty',
            detail: `We could not audit ${sourceUrl} (HTTP ${res.status}). Treating this as a weak public presence.`,
            severity: 'critical',
          },
          ...generic.findings.slice(0, 3),
        ],
        mode: 'live-audit',
        overallScore: 28,
      };
    }

    const { scores, findings } = scoreFromHtml(html, res.url || sourceUrl, elapsedMs);
    const overallScore = clampScore(average(Object.values(scores)));
    const impactLow = overallScore >= 70 ? 5 : overallScore >= 50 ? 10 : 15;
    const impactHigh = overallScore >= 70 ? 12 : overallScore >= 50 ? 20 : 30;

    return {
      overallScore,
      scores,
      findings,
      impactEstimate: `We estimate your current digital presence may be costing approximately ${impactLow}–${impactHigh} qualified inquiries per month.`,
      sourceUrl: res.url || sourceUrl,
      mode: 'live-audit',
      auditedAt: new Date().toISOString(),
    };
  } catch {
    const generic = buildGenericDigitalPresenceAudit(input.businessName);
    return {
      ...generic,
      sourceUrl,
      findings: [
        {
          title: 'Could not reach the provided URL',
          detail: `The audit could not load ${sourceUrl}. Continuing with a baseline evaluation so the workflow does not stall.`,
          severity: 'warning',
        },
        ...generic.findings.slice(0, 3),
      ],
      mode: 'live-audit',
      overallScore: 30,
    };
  }
}

export function digitalPresenceSummaryLine(audit: DigitalPresenceAudit): string {
  return `Digital Presence Score ${audit.overallScore}/100${audit.sourceUrl ? ` · ${audit.sourceUrl}` : ''}`;
}

export { DIMENSION_LABELS };
