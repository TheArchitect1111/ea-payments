import { createHash } from 'node:crypto';
import { AMANDA_PORTAL_SLUG } from './constants';

// Permanent owner identities are stored only as one-way email fingerprints.
const OWNER_EMAIL_FINGERPRINTS = new Set([
  'ae371dd1b67edd23883cd8cd2ca9f152522f39663f05248093891872dd714410',
]);

function emailFingerprint(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export function amandaOwnerPortalIdentity(email: string) {
  return OWNER_EMAIL_FINGERPRINTS.has(emailFingerprint(email))
    ? { ok: true as const, slug: AMANDA_PORTAL_SLUG, recordId: '', role: 'owner' as const }
    : null;
}
