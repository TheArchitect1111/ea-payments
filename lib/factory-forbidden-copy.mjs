/**
 * Forbidden public-facing copy for Factory / UXG previews.
 * Shared by planning, concept compose, and quality gate (pure, no I/O).
 */

export const FORBIDDEN_COPY_PATTERNS = [
  /research the subject/i,
  /produce a matched website/i,
  /exists to help the people it serves/i,
  /workorder-/i,
  /work[\s_-]?order/i,
  /projectcontext/i,
  /source:\s*universal quick launch/i,
  /desired output:/i,
  /distinguishing detail:/i,
  /internal prompt/i,
  /complete client transformation package/i,
];

/** Thin boilerplate slogans that must never ship as hero/story copy. */
export const FORBIDDEN_SLOGAN_PATTERNS = [
  /exists to help .+ move forward/i,
  /help the people it serves move forward/i,
  /find purpose and momentum/i,
  /move from uncertainty to a clear next step/i,
  /a story still being written/i,
  /continue the conversation/i,
  /how the work unfolds/i,
  /documentary photography/i,
  /full-bleed threshold/i,
  /asymmetric editorial lead/i,
  /lens craft:/i,
];

/**
 * @param {string | undefined | null} text
 * @returns {boolean}
 */
export function containsForbiddenPublicCopy(text) {
  if (!text || typeof text !== 'string') return false;
  const value = text.trim();
  if (!value) return false;
  for (const pattern of FORBIDDEN_COPY_PATTERNS) {
    if (pattern.test(value)) return true;
  }
  for (const pattern of FORBIDDEN_SLOGAN_PATTERNS) {
    if (pattern.test(value)) return true;
  }
  return false;
}

/**
 * @param {string | undefined | null} text
 * @returns {string | undefined}
 */
export function scrubForbiddenPublicCopy(text) {
  if (!text || typeof text !== 'string') return undefined;
  const value = text.trim();
  if (!value) return undefined;
  if (containsForbiddenPublicCopy(value)) return undefined;
  // Drop Factory launch goals that leaked into copy.
  if (/^research\b/i.test(value) && /website|portal|landing/i.test(value)) {
    return undefined;
  }
  return value;
}

/**
 * Collect every string leaf from a value (for gate scans).
 * @param {unknown} value
 * @param {string[]} out
 */
export function collectStrings(value, out = []) {
  if (typeof value === 'string') {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

/**
 * @param {unknown} payload
 * @returns {{ ok: boolean, matches: string[] }}
 */
export function findForbiddenPublicCopy(payload) {
  const matches = [];
  for (const text of collectStrings(payload)) {
    if (containsForbiddenPublicCopy(text)) matches.push(text.slice(0, 160));
  }
  return { ok: matches.length === 0, matches };
}
