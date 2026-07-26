/**
 * UNIVERSAL_PEOPLE — default OFF (INV-17).
 * Set UNIVERSAL_PEOPLE=1|true|on|yes to enable People routes and provisioning hooks.
 */
export function isUniversalPeopleEnabled(): boolean {
  const raw = process.env.UNIVERSAL_PEOPLE?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes';
}

export function peopleMajorityAge(): number {
  const n = Number(process.env.PEOPLE_MAJORITY_AGE?.trim() || '18');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 18;
}
