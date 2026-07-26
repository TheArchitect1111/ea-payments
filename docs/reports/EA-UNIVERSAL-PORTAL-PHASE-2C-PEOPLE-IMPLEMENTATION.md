# EA Universal Portal — Phase 2C People Transactional Persistence — Implementation Report

**Sprint date:** 2026-07-26  
**Blueprint:** `docs/plans/EA-UNIVERSAL-PORTAL-PHASE-2C-PEOPLE-TRANSACTIONAL-PERSISTENCE-BLUEPRINT.md`  
**Security review:** `docs/reviews/EA-UNIVERSAL-PORTAL-PHASE-2C-PEOPLE-TRANSACTIONAL-SECURITY-REVIEW.md`  
**Runtime cert:** `docs/reports/EA-UNIVERSAL-PORTAL-PHASE-2C-PEOPLE-RUNTIME-CERTIFICATION.md`  
**Launch impact:** People SoR is certifiable on isolated Postgres; production flags remain **OFF**.

**Implementation + local certification verdict:** **CERTIFIED** (isolated Docker Supabase only)

---

## Phase 2B close

Closed as **REQUIRES DIFFERENT DATASTORE**. Airtable People SoR quarantined under `lib/people/_quarantine_airtable_sor/`.

---

## Schema & roles

Migrations:

- `007_people_phase2c_schema.sql` — schema, tables, constraints, RLS, RPCs, revokes  
- `008_people_phase2c_postgrest_wiring.sql` — `people_app` JWT role, `db-pre-request`  
- `009_people_upsert_relationship.sql` — concurrent relationship upsert  
- `010_people_get_person.sql` — PK read under FORCE RLS  

Config: `supabase/config.toml` exposes `people` schema; analytics/studio/storage/realtime disabled for Windows local cert.

Roles: `people_owner`, `people_migrator`, `people_app`, `people_readonly_audit`.  
INV-29: `service_role` / `anon` / `authenticated` revoked from `people.*` (ADV-P-12 select/insert **403**).

---

## Defects fixed during live cert

| Defect | Fix |
|---|---|
| JWT `iat`/`nbf` vs Docker clock skew | Backdated `iat`; omit `nbf` in local orchestrator |
| Concurrent relationship UNIQUE race | `people.upsert_relationship` RPC + repository wiring |
| `getPerson` empty under FORCE RLS (no org GUC) | `people.get_person` SECURITY DEFINER RPC |
| ADV-P-8 depended on ADV-P-1 person | Independent OCC fixture person |

---

## App wiring

`postgres-client`, `postgres-repository`, adapter → Postgres when Persist ON; flags assert Postgres; guard requires `kind === 'postgres'`. No Airtable/memory People SoR fallback. Client Records remain Airtable.

---

## Enablement

**Do not** enable `UNIVERSAL_PEOPLE` / `UNIVERSAL_PEOPLE_PERSIST` in production.  
**Do not** commit/push/deploy as part of this cert.  
Local stack stopped with `--no-backup` after cert; config + migrations + redacted evidence retained.

Orchestrator: `scripts/run-people-phase2c-local-cert.mjs`  
Cert harness: `scripts/runtime-cert-people-phase2c.mts`
