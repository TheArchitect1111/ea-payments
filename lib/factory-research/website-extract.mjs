/**
 * Pure HTML metadata extraction for Website research provider (no AI).
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
      ? html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
        html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)
      : null;
  return match?.[1]?.trim();
}

function decodeBasicEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Build structured website research data from a fetch result.
 */
export function buildWebsiteArtifactData({ url, status, contentType, html, fetchError }) {
  if (fetchError) {
    return {
      url,
      ok: false,
      error: String(fetchError).slice(0, 500),
      extracted: null,
    };
  }

  const title = extractTitle(html);
  const description =
    extractMetaContent(html, 'description') || extractMetaContent(html, 'og:description');
  const ogTitle = extractMetaContent(html, 'og:title');
  const ogImage = extractMetaContent(html, 'og:image');
  const ogSiteName = extractMetaContent(html, 'og:site_name');
  const canonical = extractCanonical(html);

  return {
    url,
    ok: true,
    httpStatus: status,
    contentType: contentType || null,
    extracted: {
      title: title || ogTitle || null,
      description: description || null,
      canonical: canonical || null,
      ogTitle: ogTitle || null,
      ogImage: ogImage || null,
      ogSiteName: ogSiteName || null,
    },
  };
}
