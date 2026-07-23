const QUARANTINED_SITE_SLUGS = new Set(['amanda-catherine']);

export function isSiteQuarantined(slug: string): boolean {
  return QUARANTINED_SITE_SLUGS.has(slug.trim().toLowerCase());
}
