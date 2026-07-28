# People Phase 2D — Production Unblock Runbook

**Goal:** Preflight PASS. Flags stay **OFF** until owner GO.

**Project:** `dwygvwnjjaennksddniu`  
**Blockers (last preflight):** `people_app_schema_usage=0`, `people_app` REST 401 Invalid API key

## Prerequisites (you must supply)

Vercel **Encrypted** secrets do not pull into local `.env` (values come back empty). Provide in the same shell:

1. **Supabase access token** — https://supabase.com/dashboard/account/tokens  
   `$env:SUPABASE_ACCESS_TOKEN = "sbp_..."`
2. **JWT secret** — Project Settings → API → JWT Secret  
   `$env:PEOPLE_SUPABASE_JWT_SECRET = "..."`  
   (or `$env:SUPABASE_JWT_SECRET`)

## One command

```powershell
cd ea-payments
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
$env:PEOPLE_SUPABASE_JWT_SECRET = "..."
node scripts/people-phase2d-unblock.mjs
node scripts/people-phase2d-prod-preflight.mjs
```

What unblock does:

1. Applies [`supabase/migrations/011_people_app_schema_grants.sql`](../../supabase/migrations/011_people_app_schema_grants.sql) via Management API  
2. Mints `people_app` JWT and sets Vercel Production `PEOPLE_SUPABASE_KEY` (+ URL)  
3. Does **not** set `UNIVERSAL_PEOPLE*`

## Manual SQL fallback (if Management API blocked)

Open: https://supabase.com/dashboard/project/dwygvwnjjaennksddniu/sql/new  

Paste and run the full contents of `011_people_app_schema_grants.sql`, then re-run mint:

```powershell
$env:PEOPLE_SUPABASE_JWT_SECRET = "..."
# ensure .env.people.prod is not relied on for Encrypted empties — use env vars
node scripts/people-phase2d-mint-key.mjs
```

## Enablement — NO-GO until owner says go

After preflight **PASS**, still **do not** enable:

| Flag | When |
|------|------|
| `UNIVERSAL_PEOPLE_PERSIST=1` | After PITR/backups confirmed + owner GO |
| `UNIVERSAL_PEOPLE=1` | After Persist ON + people_app REST healthy |
| `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS` | Keep `0` until separate backfill window |

## Success criteria

- `people_app_schema_usage` PASS  
- `people_app_rest_probe` PASS  
- `people_app_rpc_get_person_readonly` PASS  
- `UNIVERSAL_PEOPLE*` absent on Production  
- Verdict: **PASS** in `docs/reports/EA-UNIVERSAL-PORTAL-PHASE-2D-PEOPLE-PROD-PREFLIGHT.md`
