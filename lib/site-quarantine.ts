/**
 * Public site quarantine — blocks live /sites/{slug} until cert + explicit activate.
 * Amanda Catherine stays quarantined unless EA_AMANDA_SITE_LIVE=1.
 */
const QUARANTINED_SITE_SLUGS = new Set(['amanda-catherine']);

function envFlagTrue(name: string): boolean {
  const raw = (process.env[name] || '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function isAmandaSiteLiveEnabled(): boolean {
  return envFlagTrue('EA_AMANDA_SITE_LIVE');
}

export function isSiteQuarantined(slug: string): boolean {
  const key = slug.trim().toLowerCase();
  if (key === 'amanda-catherine' && isAmandaSiteLiveEnabled()) {
    return false;
  }
  return QUARANTINED_SITE_SLUGS.has(key);
}

export function listQuarantinedSiteSlugs(): string[] {
  return [...QUARANTINED_SITE_SLUGS];
}
