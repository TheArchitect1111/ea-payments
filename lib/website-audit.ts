export type AuditSeverity = 'critical' | 'warning' | 'info' | 'strength';
export type AuditCategory =
  | 'visibility'
  | 'conversion'
  | 'communication'
  | 'performance'
  | 'accessibility';

export interface AuditFinding {
  id: string;
  category: AuditCategory;
  severity: AuditSeverity;
  title: string;
  detail: string;
}

export interface WebsiteAuditResult {
  url: string;
  title: string;
  description?: string;
  clarityScore: number;
  findings: AuditFinding[];
  patterns: string[];
  strengths: string[];
  missedOpportunities: string[];
  source: 'playwright-pipeline' | 'fetch-audit';
  auditedAt: string;
}

export async function runWebsiteAudit(url: string): Promise<WebsiteAuditResult> {
  const normalized = url.trim();
  if (!normalized.startsWith('http')) {
    throw new Error('URL must start with http:// or https://');
  }

  const external = await tryExternalPlaywright(normalized);
  if (external) return external;

  return runFetchAudit(normalized);
}

async function tryExternalPlaywright(url: string): Promise<WebsiteAuditResult | null> {
  const runnerUrl = process.env.PLAYWRIGHT_AUDIT_URL;
  if (!runnerUrl) return null;

  try {
    const res = await fetch(runnerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as WebsiteAuditResult;
    return { ...data, source: 'playwright-pipeline' };
  } catch {
    return null;
  }
}

async function runFetchAudit(url: string): Promise<WebsiteAuditResult> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'EA-Simplifi-Audit/4.0 Playwright-Pipeline (+https://efficiencyarchitects.online)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Could not fetch page (${res.status}).`);
  }

  const html = await res.text();
  const title = extractMeta(html, 'title') ?? new URL(url).hostname;
  const description = extractMeta(html, 'description') ?? extractMeta(html, 'og:description');

  const findings: AuditFinding[] = [];
  const patterns: string[] = [];
  const strengths: string[] = [];
  const missedOpportunities: string[] = [];

  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  const hasViewport = /name=["']viewport["']/i.test(html);
  const hasOg = /property=["']og:/i.test(html);
  const ctaPattern =
    /contact|get started|book|schedule|sign up|register|free consult|request/i;
  const hasCta = ctaPattern.test(html);
  const hasForm = /<form[\s>]/i.test(html);
  const hasEmail = /mailto:|@[a-z0-9.-]+\.[a-z]{2,}/i.test(html);
  const hasPhone = /\(\d{3}\)|\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(html);
  const imgCount = (html.match(/<img[\s>]/gi) ?? []).length;
  const altMissing = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) ?? []).length;
  const text = stripHtml(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (!description || description.length < 40) {
    findings.push({
      id: 'meta-description',
      category: 'visibility',
      severity: 'critical',
      title: 'Weak or missing meta description',
      detail: 'Search and social previews lack a clear value proposition.',
    });
    missedOpportunities.push('Search visibility and click-through from shared links');
  } else {
    strengths.push('Meta description present for search and social sharing');
  }

  if (h1Count === 0) {
    findings.push({
      id: 'missing-h1',
      category: 'visibility',
      severity: 'critical',
      title: 'No primary headline (H1) detected',
      detail: 'Visitors may not immediately understand what you offer.',
    });
  } else if (h1Count > 1) {
    findings.push({
      id: 'multiple-h1',
      category: 'visibility',
      severity: 'warning',
      title: 'Multiple H1 headings',
      detail: 'Split focus — one clear headline converts better.',
    });
    patterns.push('Messaging tries to say everything at once');
  } else {
    strengths.push('Single primary headline detected');
  }

  if (!hasCta) {
    findings.push({
      id: 'no-cta',
      category: 'conversion',
      severity: 'critical',
      title: 'No clear call-to-action language',
      detail: 'No contact, book, schedule, or get-started prompts found.',
    });
    missedOpportunities.push('Lead capture and conversion paths');
  }

  if (!hasForm && !hasEmail && !hasPhone) {
    findings.push({
      id: 'no-contact',
      category: 'conversion',
      severity: 'warning',
      title: 'Limited contact pathways',
      detail: 'No form, email, or phone pattern detected on the page.',
    });
  }

  if (!hasViewport) {
    findings.push({
      id: 'no-viewport',
      category: 'accessibility',
      severity: 'warning',
      title: 'Mobile viewport meta missing',
      detail: 'Mobile experience may be degraded.',
    });
    patterns.push('Mobile-first experience not signaled');
  } else {
    strengths.push('Mobile viewport configured');
  }

  if (imgCount > 0 && altMissing > imgCount * 0.5) {
    findings.push({
      id: 'missing-alt',
      category: 'accessibility',
      severity: 'info',
      title: 'Many images missing alt text',
      detail: `${altMissing} of ${imgCount} images may lack accessibility descriptions.`,
    });
  }

  if (wordCount < 150) {
    findings.push({
      id: 'thin-content',
      category: 'communication',
      severity: 'warning',
      title: 'Thin page content',
      detail: 'The page may explain too little to build trust or convert visitors.',
    });
    patterns.push('Website works harder to explain itself than to attract action');
  } else if (wordCount > 2500) {
    patterns.push('Long-form content — clarity and hierarchy matter');
  }

  if (!hasOg) {
    findings.push({
      id: 'no-og',
      category: 'communication',
      severity: 'info',
      title: 'Open Graph tags not detected',
      detail: 'Shared links may look generic on social platforms.',
    });
  }

  if (title.length > 60) {
    findings.push({
      id: 'long-title',
      category: 'visibility',
      severity: 'info',
      title: 'Page title may truncate in search',
      detail: `Title is ${title.length} characters — aim for under 60.`,
    });
  }

  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;
  let clarityScore = 85 - criticalCount * 18 - warningCount * 8 + strengths.length * 5;
  clarityScore = Math.max(0, Math.min(100, Math.round(clarityScore)));

  if (patterns.length === 0 && criticalCount > 0) {
    patterns.push('Visitors may leave without understanding the next step');
  }

  return {
    url,
    title,
    description,
    clarityScore,
    findings,
    patterns,
    strengths,
    missedOpportunities,
    source: 'fetch-audit',
    auditedAt: new Date().toISOString(),
  };
}

function extractMeta(html: string, kind: string): string | undefined {
  if (kind === 'title') {
    return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  }
  const desc =
    html.match(new RegExp(`name=["']${kind}["']\\s+content=["']([^"']+)["']`, 'i')) ??
    html.match(new RegExp(`property=["']${kind}["']\\s+content=["']([^"']+)["']`, 'i'));
  return desc?.[1]?.trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
