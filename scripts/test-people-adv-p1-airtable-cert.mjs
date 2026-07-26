#!/usr/bin/env node
/**
 * QUARANTINED — Phase 2B Airtable ADV-P-1 multi-process cert.
 * Airtable People SoR rejected (REQUIRES DIFFERENT DATASTORE). Exit 4.
 */
console.error(
  JSON.stringify({
    ok: false,
    quarantined: true,
    reason: 'Airtable People SoR rejected — use scripts/runtime-cert-people-phase2c.mts',
  }),
);
process.exit(4);
