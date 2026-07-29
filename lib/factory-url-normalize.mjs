/**
 * Shared launch URL normalization for Factory / Universal Quick Launch.
 * Bare domains, www variants, and trailing slashes collapse to one https URL.
 */

const HOST_LIKE =
  /^(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:[/:?#].*)?$/i;

const DOMAIN_IN_TEXT =
  /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s]*)?/gi;

/**
 * @param {string | undefined | null} raw
 * @returns {string | undefined}
 */
export function normalizeLaunchUrl(raw) {
  if (!raw || typeof raw !== 'string') return undefined;
  let value = raw.trim();
  if (!value) return undefined;

  // Strip surrounding punctuation / markdown leftovers.
  value = value.replace(/^[\s<"'(]+/, '').replace(/[\s>"'),.]+$/, '');
  if (!value) return undefined;

  // Reject obvious non-web tokens.
  if (/\s/.test(value) && !/^https?:\/\//i.test(value)) {
    // Might be prose — try domain extraction instead of whole string.
    const extracted = extractFirstUrlFromText(value);
    return extracted;
  }

  if (!/^https?:\/\//i.test(value)) {
    if (!HOST_LIKE.test(value)) return undefined;
    value = `https://${value.replace(/^\/+/, '')}`;
  }

  try {
    const parsed = new URL(value);
    if (!/^https?:$/i.test(parsed.protocol)) return undefined;
    if (!parsed.hostname || !parsed.hostname.includes('.')) return undefined;
    parsed.hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    // Drop default trailing slash-only paths for stable identity keys.
    if (parsed.pathname === '/') parsed.pathname = '';
    const normalized = parsed.toString().replace(/\/$/, '');
    if (/\/api\/ctp\/assets\//i.test(normalized)) return undefined;
    return normalized;
  } catch {
    return undefined;
  }
}

/**
 * @param {string | undefined | null} text
 * @returns {string | undefined}
 */
export function extractFirstUrlFromText(text) {
  if (!text || typeof text !== 'string') return undefined;
  const matches = text.match(DOMAIN_IN_TEXT) || [];
  for (const match of matches) {
    const normalized = normalizeLaunchUrl(match);
    if (normalized) return normalized;
  }
  return undefined;
}

/**
 * Pull official URL from launch notes / free-text fields.
 * @param {string | undefined | null} notes
 * @returns {string | undefined}
 */
export function extractUrlFromLaunchNotes(notes) {
  if (!notes || typeof notes !== 'string') return undefined;
  const lines = notes.split(/\r?\n/);
  for (const line of lines) {
    const known = line.match(
      /^(?:Known website\/social|Reference URL|Source URL|Official (?:website|site|URL))\s*:\s*(.+)$/i,
    );
    if (known?.[1]) {
      const normalized = normalizeLaunchUrl(known[1].trim());
      if (normalized) return normalized;
    }
  }
  return extractFirstUrlFromText(notes);
}

/**
 * True when the string is already a usable absolute http(s) URL or a bare host.
 * @param {string | undefined | null} raw
 */
export function isLaunchUrlCandidate(raw) {
  return Boolean(normalizeLaunchUrl(raw));
}
