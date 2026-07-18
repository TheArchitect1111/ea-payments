/**
 * Pure HTML extraction for Website research provider (no AI).
 * Meta + body signals + crawl-candidate links for light same-origin follow-ups.
 */

export function extractMetaContent(html, nameOrProperty) {
  if (!html || typeof html !== 'string') return undefined;
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${nameOrProperty}["'][^>]+content=["']([^"']*)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${nameOrProperty}["']`,
      'i',
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeBasicEntities(match[1].trim());
  }
  return undefined;
}

export function extractTitle(html) {
  const match = typeof html === 'string' ? html.match(/<title[^>]*>([^<]*)<\/title>/i) : null;
  return match?.[1] ? decodeBasicEntities(match[1].trim()) : undefined;
}

export function extractCanonical(html) {
  const match =
    typeof html === 'string'
      ? html.match(/<link[^>]+rel=["']canonical[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
        html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical[^"']*["']/i)
      : null;
  return match?.[1]?.trim();
}

function decodeBasicEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, ' ');
}

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractHeadings(html, tag, limit = 8) {
  if (!html || typeof html !== 'string') return [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out = [];
  let match;
  while ((match = re.exec(html)) && out.length < limit) {
    const text = decodeBasicEntities(stripTags(match[1])).slice(0, 160);
    if (text.length > 1) out.push(text);
  }
  return out;
}

const CTA_WORDS =
  /\b(book|register|sign\s*up|get\s*started|contact|schedule|donate|join|apply|enroll|learn\s*more|request|subscribe)\b/i;

export function extractNavLabels(html, limit = 16) {
  if (!html || typeof html !== 'string') return [];
  const navBlock =
    html.match(/<nav[\s\S]*?<\/nav>/i)?.[0] ||
    html.match(/<header[\s\S]*?<\/header>/i)?.[0] ||
    '';
  if (!navBlock) return [];
  const labels = [];
  const re = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(navBlock)) && labels.length < limit) {
    const text = decodeBasicEntities(stripTags(match[1])).slice(0, 48);
    if (text.length >= 2 && text.length <= 40 && !labels.includes(text)) {
      labels.push(text);
    }
  }
  return labels;
}

export function extractCtaLabels(html, limit = 8) {
  if (!html || typeof html !== 'string') return [];
  const out = [];
  const re = /<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/gi;
  let match;
  while ((match = re.exec(html)) && out.length < limit) {
    const text = decodeBasicEntities(stripTags(match[1])).slice(0, 60);
    if (text.length >= 2 && text.length <= 48 && CTA_WORDS.test(text) && !out.includes(text)) {
      out.push(text);
    }
  }
  return out;
}

export function extractContactHints(text) {
  const blob = String(text || '');
  const email = blob.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  const phone = blob.match(
    /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/,
  )?.[0];
  return {
    email: email || null,
    phone: phone || null,
  };
}

export function extractTextPreview(html, maxChars = 2800) {
  const body = typeof html === 'string' ? html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html : '';
  return stripTags(body).slice(0, maxChars);
}

const CRAWL_HINT =
  /\b(about|contact|services?|programs?|team|our-story|who-we-are|membership|get-involved|mission)\b/i;

/**
 * Pick up to `limit` same-origin URLs that look like About / Contact / Services pages.
 */
export function selectCrawlCandidateUrls(html, baseUrl, limit = 3) {
  if (!html || !baseUrl) return [];
  let origin;
  let base;
  try {
    base = new URL(baseUrl);
    origin = base.origin;
  } catch {
    return [];
  }

  const seen = new Set([base.href.replace(/\/$/, ''), `${origin}/`]);
  const scored = [];
  const re = /<a\b[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html))) {
    const href = match[1]?.trim();
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue;
    }
    let absolute;
    try {
      absolute = new URL(href, base);
    } catch {
      continue;
    }
    if (absolute.origin !== origin) continue;
    if (!/^https?:$/i.test(absolute.protocol)) continue;
    const normalized = absolute.href.split('#')[0].replace(/\/$/, '') || absolute.origin;
    if (seen.has(normalized)) continue;
    const label = decodeBasicEntities(stripTags(match[2] || '')).slice(0, 80);
    const path = `${absolute.pathname} ${label}`;
    if (!CRAWL_HINT.test(path)) continue;
    seen.add(normalized);
    const score =
      (/about|mission|our-story|who-we-are/i.test(path) ? 3 : 0) +
      (/contact/i.test(path) ? 2 : 0) +
      (/services?|programs?|membership/i.test(path) ? 2 : 0) +
      (/team/i.test(path) ? 1 : 0);
    scored.push({ url: absolute.href, label, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.url);
}

/**
 * Extract structured signals from a single HTML page.
 */
export function extractPageSignals(html, pageUrl) {
  const title = extractTitle(html);
  const description =
    extractMetaContent(html, 'description') || extractMetaContent(html, 'og:description');
  const h1 = extractHeadings(html, 'h1', 4);
  const h2 = extractHeadings(html, 'h2', 8);
  const navLabels = extractNavLabels(html);
  const ctas = extractCtaLabels(html);
  const textPreview = extractTextPreview(html);
  const contact = extractContactHints(`${description || ''} ${textPreview}`);

  return {
    url: pageUrl || null,
    title: title || extractMetaContent(html, 'og:title') || null,
    description: description || null,
    h1,
    h2,
    navLabels,
    ctas,
    textPreview,
    email: contact.email,
    phone: contact.phone,
  };
}

/**
 * Build structured website research data from a fetch result.
 * Optional `extraPages` from light same-origin crawl.
 */
export function buildWebsiteArtifactData({
  url,
  status,
  contentType,
  html,
  fetchError,
  extraPages,
}) {
  if (fetchError) {
    return {
      url,
      ok: false,
      error: String(fetchError).slice(0, 500),
      extracted: null,
    };
  }

  const home = extractPageSignals(html, url);
  const ogTitle = extractMetaContent(html, 'og:title');
  const ogImage = extractMetaContent(html, 'og:image');
  const ogSiteName = extractMetaContent(html, 'og:site_name');
  const canonical = extractCanonical(html);
  const crawlCandidates = selectCrawlCandidateUrls(html, url, 3);

  const pages = [
    {
      role: 'home',
      url: home.url,
      title: home.title,
      description: home.description,
      h1: home.h1,
      h2: home.h2,
      navLabels: home.navLabels,
      ctas: home.ctas,
      textPreview: home.textPreview,
      email: home.email,
      phone: home.phone,
    },
  ];

  for (const page of extraPages || []) {
    if (!page?.html || !page?.url) continue;
    const signals = extractPageSignals(page.html, page.url);
    pages.push({
      role: 'related',
      url: signals.url,
      title: signals.title,
      description: signals.description,
      h1: signals.h1,
      h2: signals.h2,
      navLabels: signals.navLabels,
      ctas: signals.ctas,
      textPreview: signals.textPreview,
      email: signals.email,
      phone: signals.phone,
    });
  }

  const rolledText = pages
    .map((p) => [p.title, p.description, (p.h1 || []).join(' '), p.textPreview].filter(Boolean).join('\n'))
    .join('\n\n')
    .slice(0, 6000);

  const allCtas = [...new Set(pages.flatMap((p) => p.ctas || []))].slice(0, 10);
  const allH1 = [...new Set(pages.flatMap((p) => p.h1 || []))].slice(0, 10);
  const email = pages.map((p) => p.email).find(Boolean) || null;
  const phone = pages.map((p) => p.phone).find(Boolean) || null;

  return {
    url,
    ok: true,
    httpStatus: status,
    contentType: contentType || null,
    extracted: {
      title: home.title || ogTitle || null,
      description: home.description || null,
      canonical: canonical || null,
      ogTitle: ogTitle || null,
      ogImage: ogImage || null,
      ogSiteName: ogSiteName || null,
      h1: allH1,
      h2: home.h2,
      navLabels: home.navLabels,
      ctas: allCtas,
      textPreview: rolledText.slice(0, 3200),
      email,
      phone,
      crawlCandidates,
      pages: pages.map((p) => ({
        role: p.role,
        url: p.url,
        title: p.title,
        description: p.description,
        h1: p.h1,
        ctas: p.ctas,
        textPreview: (p.textPreview || '').slice(0, 1200),
      })),
    },
  };
}
