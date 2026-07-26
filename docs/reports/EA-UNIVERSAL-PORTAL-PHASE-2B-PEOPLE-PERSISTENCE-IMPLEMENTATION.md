# EA Universal Portal — Phase 2B People Persistence — FINAL

**Status:** **CLOSED**  
**Final verdict:** **REQUIRES DIFFERENT DATASTORE**  
**Date:** 2026-07-26 (formal close during Phase 2C sprint)  
**Flags:** `UNIVERSAL_PEOPLE`, `UNIVERSAL_PEOPLE_PERSIST`, `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS` remain **default OFF**  
**Successor:** Phase 2C Supabase Postgres (`people` schema)

---

## Disposition

| Item | Action |
|---|---|
| Airtable as People SoR | **Rejected** — ADV-P-1 FAIL (3 authoritative Persons under 12-process race) |
| Airtable People adapter / tables | **Quarantined** under `lib/people/_quarantine_airtable_sor/` |
| Airtable cert / reconcile scripts | **Quarantined** (exit 4 stubs) |
| Domain types, ACL, guards, flags, repository interface, memory store/tests, jobs, redaction, merge/import semantics | **Preserved** for Phase 2C |
| Client Records (Airtable) | **Unchanged** — remain commerce SoR; not deleted |

Evidence retained:

- `docs/audits/runtime-evidence-people-phase2b/cert-session-final-2026-07-26.json`
- `docs/audits/runtime-evidence-people-phase2b/adv-p1-airtable-2026-07-26.json`

Production Airtable was never used as People SoR enablement target.

---

## Why closed

Airtable cannot enforce UNIQUE on ordinary text fields. Application check-then-act and process-local locks are not multi-instance uniqueness. Phase 2B security stop-gate applies: do not enable People on this path.

---

## Phase 2C handoff

Transactional People persistence is implemented against Supabase Postgres per:

- `docs/plans/EA-UNIVERSAL-PORTAL-PHASE-2C-PEOPLE-TRANSACTIONAL-PERSISTENCE-BLUEPRINT.md`
- `docs/reviews/EA-UNIVERSAL-PORTAL-PHASE-2C-PEOPLE-TRANSACTIONAL-SECURITY-REVIEW.md`
