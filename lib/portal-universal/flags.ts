/**
 * Feature flag for IndustryPack-driven nav/branding.
 * Default OFF — preserves PortalShell / CX behavior when unset.
 * Set UNIVERSAL_NAV_PACKS=1|true|on to enable.
 */
export function isUniversalNavPacksEnabled(): boolean {
  const raw = process.env.UNIVERSAL_NAV_PACKS?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes';
}
