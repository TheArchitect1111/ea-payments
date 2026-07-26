#!/usr/bin/env node
/**
 * QUARANTINED — Phase 2B Airtable schema reconcile for People SoR.
 * Do not apply People tables to Airtable. Exit 4.
 */
console.error(
  JSON.stringify({
    ok: false,
    quarantined: true,
    reason: 'Airtable People SoR rejected — apply supabase/migrations/007_people_phase2c_schema.sql',
  }),
);
process.exit(4);
