# EA Universal Portal — Phase 2C People Runtime Certification

**Date:** 2026-07-26  
**Environment:** Isolated local Supabase via Docker (`npx supabase`, project `ea-payments`)  
**Harness:** `scripts/run-people-phase2c-local-cert.mjs` → `scripts/runtime-cert-people-phase2c.mts`  
**Evidence:** `docs/audits/runtime-evidence-people-phase2c/` (JWT fingerprints scrubbed)  
**Final verdict:** **CERTIFIED**

Skipped tests are **not** counted as passing. This cert used **0 skips** on the live matrix.

---

## Live database matrix

| ID | Result | Proof |
|---|---|---|
| SCHEMA | **PASS** | 15 tables, 15 FORCE RLS, 5 RPCs, `db-pre-request=people.pre_request` |
| ADV-P-1 | **PASS** | 12 concurrent ensures; **SQL count=1**, REST count=1, one id |
| ADV-P-1b | **PASS** | Concurrent staff create → one id |
| ADV-P-2 | **PASS** | Concurrent relationship upsert; SQL active edges=1 |
| ADV-P-3 | **PASS** | Import idempotency; SQL jobs=1 |
| ADV-P-4 | **PASS** | `merge_finalize` tombstone |
| ADV-P-5 | **PASS** | Forced SQL rollback; no partial state |
| ADV-P-6 | **PASS** | Concurrent merge_finalize |
| ADV-P-7 | **PASS** | Body org stripped; RLS hides other org |
| ADV-P-8 | **PASS** | Stale OCC rejected |
| ADV-P-9 | **PASS** | Migration checkpoint durable |
| ADV-P-10 | **PASS** | Outage / missing creds fail-closed |
| ADV-P-11 | **PASS** | Illegal prod flags denied |
| ADV-P-12 | **PASS** | service_role select=403 insert=403 |
| ADV-P-13 | **PASS** | Tombstoned persons present |
| ADV-P-14 | **PASS** | Audit UPDATE denied (REST + trigger) |

**Live totals:** 16 PASS / 0 FAIL / 0 SKIP

---

## Regressions

| Suite | Result |
|---|---|
| ADV-1…22 | **22/22 PASS** |
| ADV-P memory | **15/15 PASS** (Airtable live SKIPPED ≠ pass) |
| Phase 2C offline | **10 PASS** (2 documented live skips ≠ pass) |
| Phase 2A runtime cert | **25/25 PASS** |
| Provisioning regression | **PASS** |
| ESLint `lib/people` | **PASS** |
| TypeScript `lib/people` | **CLEAN** |
| Secret scan (post-scrub) | **PASS** (`eyJhbG` evidence = 0) |

---

## Security

- No production Supabase/Airtable accessed  
- Cert credentials process-scoped only (not written to `.env.local`)  
- service_role DML on `people.*` denied  
- Local containers stopped/removed after cert (`supabase stop --no-backup`)  
- Production People flags remain **OFF**

---

## Verdict

### **CERTIFIED**

Local isolated Docker Supabase certification complete. Production enablement still requires owner approval, separate prod role/secret separation, PITR drill, and explicit flag turn-on — **not** done in this sprint.
