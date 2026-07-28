# EA Universal Portal ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Phase 2D People Production Preflight

**Verdict:** BLOCKED
**Mode:** read-only (no flag enablement, no backfill, no production writes)
**Project:** `dwygvwnjjaennksddniu`
**API:** `https://dwygvwnjjaennksddniu.supabase.co`
**At:** 2026-07-27T02:11:06.299Z

## Checks

| Check | Result | Detail |
|---|---|---|
| `access_token` | PASS | present |
| `exposed_schemas_people` | PASS | schemas=public,graphql_public,people |
| `sql_inventory` | PASS | table_count=15 |
| `people_schema` | PASS | people_schema=true |
| `tables_15` | PASS | count=15; missing=none |
| `force_rls` | PASS | force_rls=15; rls_enabled=15 |
| `required_rpcs` | PASS | rpcs=ensure_person,get_person,merge_finalize,pre_request,update_person,upsert_relationship; missing=none |
| `people_app_role` | PASS | exists=true; bypassrls=false |
| `people_app_schema_usage` | FAIL | usage_grants=0 |
| `service_role_sql_denial` | PASS | table_privs=0; routine_privs=0 |
| `migration_files_repo` | PASS | 007_people_phase2c_schema.sql, 008_people_phase2c_postgrest_wiring.sql, 009_people_upsert_relationship.sql, 010_people_get_person.sql |
| `migrations_007_010` | PASS | schema_truth_ok; recorded_versions=["007","008","009","010"] |
| `pre_request_bound` | PASS | setting=session_preload_libraries=supautils, safeupdate,statement_timeout=8s,lock_timeout=8s,pgrst.db_pre_request=people.pre_request |
| `service_role_key_fetched` | PASS | fingerprint=ed0f02b807eb |
| `service_role_rest_denial` | PASS | status=403; body={"code":"42501","details":null,"hint":null,"message":"permission denied for schema people"} |
| `people_app_rest_probe` | FAIL | status=401; body={"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."} |
| `people_app_rpc_get_person_readonly` | FAIL | status=401; body={"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."} |
| `vercel_people_url_present` | PASS | PEOPLE_SUPABASE_URL listed |
| `vercel_people_key_present` | PASS | PEOPLE_SUPABASE_KEY listed |
| `vercel_universal_people_flags_off` | PASS | UNIVERSAL_PEOPLE* not listed on production |
| `vercel_no_cert_memory_flags` | PASS | absent |
| `code_no_airtable_adapter_select` | PASS | adapter never selects airtable |
| `code_persist_uses_postgres` | PASS | Persist ON ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ postgres repository |
| `code_migrate_flag_default_off` | PASS | migrate flag gated |
| `code_backfill_gated` | PASS | backfill module exists and is flag-gated in callers |
| `no_client_record_backfill_this_run` | PASS | preflight did not invoke migrate/backfill |
| `no_production_data_writes_this_run` | PASS | preflight used SELECT/inventory + read REST only |

## Blockers

- **people_app_schema_usage**: usage_grants=0
- **people_app_rest_probe**: status=401; body={"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â people_app JWT rejected ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â verify Exposed schemas + JWT secret match project
- **people_app_rpc_get_person_readonly**: status=401; body={"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}

## Enablement requirements (remaining)

1. Owner approval to enable People on production (launch decision).
2. Confirm PITR / backups and monitoring on project dwygvwnjjaennksddniu.
3. Set UNIVERSAL_PEOPLE_PERSIST=1 on Vercel Production (Postgres SoR) before or with People ON (INV-20).
4. Set UNIVERSAL_PEOPLE=1 only after Persist ON + health check of people_app REST.
5. Keep UNIVERSAL_PEOPLE_MIGRATE_CLIENTS=0 until an explicit Client Record backfill runbook is executed.
6. Do not set PEOPLE_CERT_MEMORY or PEOPLE_SHARED_MEMORY on production.
7. Run controlled smoke (ensure_person / get_person) on a non-prod or disposable tenant before broad enablement.
8. Only then consider Client Record backfill under a separate change window.

## Explicit non-actions this run

- Did **not** enable `UNIVERSAL_PEOPLE*`
- Did **not** run Client Record backfill
- Did **not** deploy, commit, or push
- Did **not** modify Exposed schemas or production People data

Evidence JSON: `docs/audits/runtime-evidence-people-phase2d-prod-preflight/phase2d-prod-preflight-report.json`
