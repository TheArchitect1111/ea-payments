/**
 * Public site quarantine — blocks live /sites/{slug} until cert + explicit activate.
 * Amanda Catherine stays quarantined unless EA_AMANDA_SITE_LIVE=1.
 * Also covers fulfill-paid hashed variants (amanda-catherine-xxxxxx).
 */
const QUARANTINED_SITE_SLUGS = new Set(['amanda-catherine']);

function envFlagTrue(name: string): boolean {
  const raw = (process.env[name] || (name === 'EA_AMANDA_SITE_LIVE' ? '0' : '')).trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function isAmandaSiteLiveEnabled(): boolean {
  return envFlagTrue('EA_AMANDA_SITE_LIVE');
}

function isAmandaFamilySlug(slug: string): boolean {
  const key = slug.trim().toLowerCase();
  return key === 'amanda-catherine' || key.startsWith('amanda-catherine-');
}

export function isSiteQuarantined(slug: string): boolean {
  const key = slug.trim().toLowerCase();
  if (isAmandaFamilySlug(key) && isAmandaSiteLiveEnabled()) {
    return false;
  }
  if (isAmandaFamilySlug(key)) return true;
  return QUARANTINED_SITE_SLUGS.has(key);
}

export function listQuarantinedSiteSlugs(): string[] {
  return [...QUARANTINED_SITE_SLUGS];
}
