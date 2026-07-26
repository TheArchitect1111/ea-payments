#!/usr/bin/env node
/**
 * QUARANTINED — Phase 2B Airtable ADV-P-1 worker. Do not run against any base.
 * Exit 4 = quarantined.
 */
console.error(
  JSON.stringify({
    ok: false,
    quarantined: true,
    reason: 'Airtable People SoR rejected (REQUIRES DIFFERENT DATASTORE)',
  }),
);
process.exit(4);
