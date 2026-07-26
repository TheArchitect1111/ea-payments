#!/usr/bin/env node
/**
 * QUARANTINED — Phase 2B Airtable People SoR rejected (ADV-P-1 FAIL).
 * Do not use for Phase 2C certification. Exit 4 = quarantined path.
 */
console.error(
  JSON.stringify({
    ok: false,
    quarantined: true,
    reason: 'Airtable People SoR rejected — use Postgres Phase 2C cert harness',
    successor: 'scripts/runtime-cert-people-phase2c.mts',
  }),
);
process.exit(4);
