# EA Universal Portal — Phase 2D People Enablement Gate

**Date:** 2026-07-27  
**Status:** **NO-GO** to enable People flags on production  

## Why NO-GO

Phase 2D production preflight was **BLOCKED** (schema USAGE grants + invalid `PEOPLE_SUPABASE_KEY`).  
Unblock tooling is prepared (`011_people_app_schema_grants.sql`, `scripts/people-phase2d-unblock.mjs`) but requires operator secrets that Vercel Encrypted env pull cannot supply locally.

## Required before GO

1. Operator runs [EA-PEOPLE-PHASE-2D-UNBLOCK.md](../runbooks/EA-PEOPLE-PHASE-2D-UNBLOCK.md) with `SUPABASE_ACCESS_TOKEN` + JWT secret.  
2. `node scripts/people-phase2d-prod-preflight.mjs` returns **PASS**.  
3. Owner confirms PITR/backups on project `dwygvwnjjaennksddniu`.  
4. Explicit owner approval to enable flags.

## Enable order (only after GO)

1. `UNIVERSAL_PEOPLE_PERSIST=1`  
2. Health-check people_app REST  
3. `UNIVERSAL_PEOPLE=1`  
4. Keep `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS=0` until separate backfill  

## Explicit non-actions

- Do **not** enable `UNIVERSAL_PEOPLE*` in this phase  
- Do **not** run Client Record backfill  
- Amplifi/Magnifi V1 clients remain unaffected and live  

See: `docs/reports/EA-UNIVERSAL-PORTAL-PHASE-2D-PEOPLE-PROD-PREFLIGHT.md`
