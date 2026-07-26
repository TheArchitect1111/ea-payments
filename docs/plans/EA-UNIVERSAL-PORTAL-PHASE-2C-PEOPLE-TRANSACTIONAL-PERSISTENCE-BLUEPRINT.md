# EA Universal Portal — Phase 2C Blueprint
## Transactional People Persistence

**Status:** Blueprint only — **do not implement without an explicit implementation prompt**  
**Date:** 2026-07-26 (revised after adversarial security review)  
**Security review:** [EA-UNIVERSAL-PORTAL-PHASE-2C-PEOPLE-TRANSACTIONAL-SECURITY-REVIEW.md](../reviews/EA-UNIVERSAL-PORTAL-PHASE-2C-PEOPLE-TRANSACTIONAL-SECURITY-REVIEW.md) — **APPROVED WITH CONDITIONS**  
**Phase 2A shipped:** `9239bf98…`  
**Phase 2B disposition:** Airtable People SoR **REJECTED** (ADV-P-1 FAIL → REQUIRES DIFFERENT DATASTORE)  
**Evidence:** `docs/audits/runtime-evidence-people-phase2b/cert-session-final-2026-07-26.json`  
**Gates:** Architecture Gate, Integration Gate (2C exception after Airtable cert failure)

> **Security revision note:** §§3, 5–12, and **NEW §§17–24** incorporate every accepted **P0/P1** from the Phase 2C security review. Postgres UNIQUE alone is **not** treated as sufficient safety.

**Launch impact:** Enforceable uniqueness under concurrency is required to enable People on multi-instance Vercel.

**Out of scope:** Tasks, Novu, RJSF, industry portals, full OpenFGA, replacing Client Records SoR, dual-write People↔Airtable SoRs, enabling People before 2C cert.

---

## 0. Architecture & Integration Gate

| Question | Answer |
|---|---|
| Capacity? | **Yes** |
| Simplicity? | **Yes if** reusing Supabase Postgres with **role-separated** `people` schema; **No if** sharing unrestricted service_role DML with Simplifi |
| Refactor vs rebuild? | Refactor adapters; keep 2A domain |
| New DB product? | **Reject** (no Neon/Prisma unless separation trigger fires) |

Integration Gate scores unchanged from prior revision (Replace / Reduce / Invisible / Fit / Simplify = Yes).

---

## 1. Established facts

Airtable ADV-P-1: 12 processes → **3** authoritative Persons. Check-then-act and process locks are not durable uniqueness. Production Airtable untouched; People flags OFF.

---

## 2. Existing capabilities

Supabase Postgres exists for Simplifi (`supabase/migrations/*`, `lib/simplifi-os/supabase.ts` — **service role PostgREST**, **no RLS** in migrations). No Prisma/Drizzle/Neon app SoR.

---

## 3. Recommendation (security-conditioned)

**Authoritative People SoR: Supabase Postgres**, schema `people`.

| Decision | Rule |
|---|---|
| Same Supabase **product** | **Yes** — reuse |
| Same Supabase **project** as Simplifi | **Allowed only if** P0 role/grant separation is implemented (§9). Prefer same project for ops simplicity when separation holds. |
| Separate Supabase **project** | **Required** when separation trigger fires (§24) |
| Access path | **Mandatory** transactional SQL RPCs (`SECURITY DEFINER` set-bound) and/or `people_app` role **without** BYPASSRLS. **Forbidden:** unrestricted `service_role` DML on `people.*` tables (P0-1, P0-8). |
| PostgREST row-at-a-time merge | **Forbidden** as merge finalize path (P0-3). |

**Challenge accepted:** “Using Postgres” does not automatically make the system safe. Enforcement is UNIQUE + txn + roles + INV-1 bind + fail-closed + cert.

---

## 4. Boundary map (no dual-write ambiguity)

| Domain | SoR | Rule |
|---|---|---|
| Client Records | Airtable | Link only (`client_record_id` / external id) |
| Organizations / Memberships / PlatformRole | Airtable | Tenant key = Airtable org id text; directory roles ≠ PlatformRole |
| People directory/graph/jobs/audit | **Postgres `people`** | Authoritative |
| Backfill | One-way CR → Person | Flag-gated; never dual SoR |
| Reconcile | Report only | Never invent Client Records |

---

## 5. Relational model (schema `people`)

Stable text `person_key` PKs (Phase 2A continuity). Tenant column `organization_id text not null` on every table.

### 5.1 Core tables

- `persons` — directory root + tombstone columns (`merged_into_person_key`)  
- `person_email_keys` — **all** uniqueness-participating emails  
- `person_external_keys` — external identity uniqueness  
- `org_memberships` — directory roles only  
- `households`, `household_members`  
- `relationships`, `program_links`, `consents`, `acl_grants`  
- `merge_jobs`, `import_jobs`, `import_row_results`, `migration_checkpoints`  
- `audit_events` — append-only  

### 5.2 SQL enforcement matrix (P0/P1)

| Control | SQL / policy |
|---|---|
| Person PK | `person_key text PRIMARY KEY` |
| Email uniqueness | `UNIQUE (organization_id, email_normalized)` on `person_email_keys`; rows only for non-merged persons; exclude empty |
| Primary email sync | Same txn maintains `persons.primary_email` + email_keys |
| External id uniqueness | `UNIQUE (organization_id, system, value)` on `person_external_keys` WHERE person not merged |
| Client Record link | `UNIQUE (organization_id, client_record_id) WHERE client_record_id IS NOT NULL AND merged_into_person_key IS NULL` |
| Lifecycle check | `CHECK (lifecycle_status IN ('active','inactive','archived','deceased'))` |
| Membership status check | `CHECK (status IN ('active','inactive','invited','ended'))` |
| FK person refs | `REFERENCES people.persons(person_key)` — **ON DELETE RESTRICT** (P1-5) |
| FK household | members → households **ON DELETE CASCADE** only for member rows; persons RESTRICT |
| Tombstone FK | `merged_into_person_key REFERENCES persons(person_key)` |
| Job keys | `UNIQUE (organization_id, absorbed_person_key)` merge; `UNIQUE (organization_id, idempotency_key)` import; `UNIQUE (import_job_id, row_number)` |
| OCC | `row_version bigint NOT NULL DEFAULT 1`; update `WHERE row_version = $expected` |
| Audit append-only | `REVOKE UPDATE, DELETE ON audit_events FROM people_app`; `BEFORE UPDATE OR DELETE` trigger `RAISE EXCEPTION` |
| No empty identity upsert | App + RPC reject missing email/external key |

**Partial unique pattern (email keys):**

```sql
CREATE UNIQUE INDEX person_email_keys_org_email_uq
  ON people.person_email_keys (organization_id, email_normalized);
-- Maintenance: delete email_keys for absorbed person inside merge finalize txn.
```

---

## 6. ADV-P-1 prevention (exact Airtable failure)

| Airtable failure | Postgres control |
|---|---|
| Concurrent check-then-act inserts | UNIQUE on `(organization_id, email_normalized)` |
| Multi-instance no shared lock | Constraint is cluster-wide |
| Adapter lies about `created:true` | SoR `COUNT(*)` after race must be 1; cert hard stop |
| Application cleanup-as-uniqueness | **Forbidden** as proof |

Writer algorithm (mandatory):

1. Begin txn.  
2. `INSERT` person + email_keys + external_keys.  
3. On `unique_violation` (23505): rollback insert path; `SELECT` existing; return `{created:false}`.  
4. Commit.  

Optional: `INSERT … ON CONFLICT DO NOTHING RETURNING` then select — still one row.

---

## 7. Transaction & lock-order specification

| Op | Boundary | Isolation | Locks |
|---|---|---|---|
| `ensure_person` | Single txn | READ COMMITTED | Rely on UNIQUE; no session advisory locks across pooler (P1-3) |
| Person patch OCC | Single UPDATE | RC | Row lock implicit |
| Merge non-destructive steps | Job state machine; may be multi-txn | RC | Idempotent steps |
| **Merge finalize** | **Exactly one SQL txn** | REPEATABLE READ or RC + row locks | Lock `person_key` of absorbed and survivor in **lexicographic ascending order** (P1-2); move email_keys; set tombstone; write audit |
| Import row | Per-row txn | RC | |
| Backfill chunk | Chunk + checkpoint same txn | RC | |

**Deadlock:** catch 40P01; retry ≤ N with jitter; then terminal fail-closed.

**Pooler:** transaction mode; all locks held only inside one checkout/txn.

---

## 8. Row-level security matrix (defense-in-depth)

Enable `FORCE ROW LEVEL SECURITY` on all `people.*` tables.

| Table | Policy intent |
|---|---|
| All tenant tables | `organization_id = current_setting('people.organization_id', true)` |
| Audit | INSERT allowed for `people_app`; SELECT for `people_readonly_audit` + app as needed; no UPDATE/DELETE |
| Jobs | Same tenant predicate |

**Critical (P0-1):** RLS is **not** sufficient when using BYPASSRLS service_role. Runtime must use:

- `people_app` **without** bypass, setting `people.organization_id` per request after slug→org resolve, **or**  
- `SECURITY DEFINER` RPCs owned by `people_owner` that assert org bind internally and are `REVOKE EXECUTE FROM PUBLIC` then `GRANT EXECUTE TO people_app` only.

---

## 9. Database-role matrix

| Role | Purpose | Rights |
|---|---|---|
| `people_owner` | Migration owner | DDL on `people`; owns SECURITY DEFINER functions |
| `people_migrator` | CI/ops migrations | Same as owner in migrator contexts only |
| `people_app` | Runtime Vercel | DML on tables **or** EXECUTE on RPCs only; **no** BYPASSRLS; **no** DDL; **no** UPDATE/DELETE audit |
| `people_readonly_audit` | Forensics | SELECT audit (+ limited persons) |
| `anon` / `authenticated` | Supabase defaults | **REVOKE ALL** on schema `people` |
| `service_role` (shared Simplifi) | Simplifi only | **REVOKE ALL** on schema `people` (P0-8) |

Bootstrap sketch:

```sql
REVOKE ALL ON SCHEMA people FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA people TO people_app, people_readonly_audit;
-- table grants narrowly…
```

Simplifi continues using its existing service role on `simplifi_*` only.

---

## 10. Invariants

### Phase 2A INV-1…18 — preserved

Session-slug tenant; immutable org; per-org email uniqueness (**now DB-enforced**); directory ≠ PlatformRole; expiry/majority at evaluation; import ban; shared export redaction; audit append-only; flag OFF retain; etc.

### Phase 2B INV-19…28 — adapted

Fail-closed persist; illegal flag combo; merge finalize; tombstones; OCC; redaction; enablement gate; jsonb validate.

### Phase 2C security invariants (new)

| ID | Invariant |
|---|---|
| **INV-29** | Unrestricted `service_role` (or any BYPASSRLS role) **must not** have DML on `people.*`. |
| **INV-30** | All multi-row People writes that define SoR identity or merge finalize run in **one database transaction** (RPC/`BEGIN`). |
| **INV-31** | Every natural-key UNIQUE includes `organization_id` (email, external, client_record, job keys). |
| **INV-32** | Tenant org id for writes comes only from server slug→org resolution (INV-1); never from request body. |
| **INV-33** | No runtime fallback to Airtable People SoR or production memory SoR. |
| **INV-34** | `audit_events` are append-only at SQL privilege + trigger level. |
| **INV-35** | Client Record remains Airtable SoR; People stores links only (no dual-write SoR). |
| **INV-36** | Deadlocks retry within budget then fail closed — never silent partial merge finalize. |

---

## 11. Preserve application controls

- Subject-specific guardian ACL (INV) at evaluation time  
- Expiry + majority at check time  
- Import PlatformRole prohibition  
- Shared export redaction  
- Fail-closed on DB/pooler errors  
- Ignore body `organizationId`

---

## 12. Phase 2B WIP classification

| Item | Class |
|---|---|
| Domain types, ACL, guards, tenant, import-export, memory store/tests | **Reuse / adapt** |
| Repository interface, jobs, ensure/merge semantics, flags, errors, redaction | **Adapt** for Postgres RPCs |
| `airtable-repository.ts`, `airtable-tables.ts` as SoR | **Delete / do not commit** |
| Airtable uniqueness claims | **Discard** |

---

## 13. Flags (default OFF)

`UNIVERSAL_PEOPLE`, `UNIVERSAL_PEOPLE_PERSIST` (means **Postgres ready**), `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS`.  
Credentials: People-specific DB URL/role secrets — **not** the Simplifi-only service key if that key retains broad rights.

---

## 14. Adversarial test matrix (2C)

| ID | Test | Expect |
|---|---|---|
| ADV-P-1 | ≥12-process concurrent ensure same email | Exactly 1 authoritative Person (SQL count) |
| ADV-P-1b | Concurrent staff create | One id |
| ADV-P-2 | Concurrent relationship upsert | One active edge |
| ADV-P-3 | Import idempotency | One job; row skips |
| ADV-P-4 | Merge crash + resume | Single tombstone; finalize txn atomic |
| ADV-P-5 | Forced merge rollback | No partial tombstone |
| ADV-P-6 | Deadlock injection | Retry success or terminal |
| ADV-P-7 | Cross-tenant body org | Deny |
| ADV-P-8 | Stale OCC | 409 |
| ADV-P-9 | Restart mid-import | Checkpoint safe |
| ADV-P-10 | DB/pooler down | 503 fail-closed |
| ADV-P-11 | People ON Persist OFF prod mode | Deny |
| ADV-P-12 | service_role DML people | **Denied** |
| ADV-P-13 | GET absorbed | Redirect under ACL |
| ADV-P-14 | Audit UPDATE attempt | Fail |
| ADV-1…22 | Regression | Pass |

Skipped ≠ pass.

---

## 15. Operator setup gates

1. Cert Supabase isolated (project or scrubbed DB).  
2. Create roles; apply migrations as `people_migrator`.  
3. REVOKE service_role/anon/authenticated on `people`.  
4. Configure pooler; People app secrets for cert only.  
5. PITR enabled.  

---

## 16. Runtime-certification gates

1. ADV-P-1 PASS with SQL proof.  
2. ADV-P-12 service_role negative PASS.  
3. ADV-P-4/5/7/10/11/14 PASS.  
4. No Airtable/memory People SoR in adapter paths.  
5. Report signed; flags still default OFF.  

---

## 17. Production enablement gates

1. Prod role separation + secret separation from Simplifi cert.  
2. PITR restore drill completed.  
3. Monitors: unique_violation, deadlock, pool wait, persist_unavailable.  
4. Owner approval; INV-26 analogue for 2C.  
5. Backfill off until pilot.  

---

## 18. Supabase scale & separation trigger

Move People to a **separate Supabase project** (same product) when any hold:

| Trigger | Threshold |
|---|---|
| Cannot REVOKE Simplifi `service_role` from `people` without breaking Simplifi | Immediate |
| PITR restore of shared project would force unacceptable Simplifi downtime/data coupling | Before prod |
| Connection pool exhaustion attributed to shared pool with Simplifi write load | Sustained >2 weeks |
| Compliance requires separate data plane for directory PII | Before prod |
| Migration ownership conflicts blocking People DDL | Before impl complete |

---

## 19. Migration / rollback / recovery

- Expand-only SQL migrations under `supabase/migrations/` with `people_` prefix.  
- Rollback = flags OFF; retain data (INV-18).  
- Partial backfill: stop job; checkpoint; do not write Airtable Client Records.  
- Recovery runbook: disable People; page on unique_violation spikes; PITR only with owner approval.  

---

## 20. Sensitive data

- INV-25 redaction for logs/exports.  
- Platform encryption at rest.  
- **Before prod enable (P1-6):** evaluate column encryption for `date_of_birth` / `legal_name` if DB admin is in threat model.  

---

## 21. Client Record backfill

One-way; UNIQUE link; idempotent external id; **no** dual-write SoR; Airtable remains commerce SoR (INV-35).

---

## 22. End-state summary

| Item | Statement |
|---|---|
| Phase 2B disposition | Rejected Airtable People SoR; evidence kept |
| Recommended datastore | **Supabase Postgres `people` schema** with **role separation** |
| Why safer than Airtable | Cluster UNIQUE + real txns — **iff** P0 controls enforced |
| Reuse 2B | Domain + repository shape + memory tests |
| Discard | Airtable People SoR adapter as production path |
| Security verdict | **APPROVED WITH CONDITIONS** (see review) |
| Implementation | **Not authorized by this document alone** |

---

**Do not implement Phase 2C without an explicit implementation prompt after conditions-before-implementation are met.**
