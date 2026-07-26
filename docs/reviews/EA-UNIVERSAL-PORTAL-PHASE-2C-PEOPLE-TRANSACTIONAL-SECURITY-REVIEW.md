# EA Universal Portal — Phase 2C People Transactional Persistence Security Review

**Document type:** Adversarial architecture & security review (docs only)  
**Subject:** [EA-UNIVERSAL-PORTAL-PHASE-2C-PEOPLE-TRANSACTIONAL-PERSISTENCE-BLUEPRINT.md](../plans/EA-UNIVERSAL-PORTAL-PHASE-2C-PEOPLE-TRANSACTIONAL-PERSISTENCE-BLUEPRINT.md)  
**Also reviewed:** Phase 2B security review + implementation report; `supabase/migrations/*`; `lib/simplifi-os/supabase.ts`; Phase 2A INV-1…18 / ADV-1…22  
**Review date:** 2026-07-26  
**Scope:** Design review only — **no product code, packages, env, Supabase provision, commit, push, deploy, or People enablement**

---

## Verdict

### **APPROVED WITH CONDITIONS**

Using Postgres is **necessary** after Airtable ADV-P-1 failure, but **not sufficient**. The Phase 2C blueprint correctly rejects Airtable as People SoR and correctly prefers reusing Supabase Postgres over inventing Neon/Prisma. However, several assumptions would still allow **cross-tenant access**, **false safety from RLS**, **merge partiality**, or **ops blast radius** if implemented as first written.

Postgres UNIQUE prevents the **exact Airtable ADV-P-1 storage failure** only if: partial unique indexes are correct, concurrent creates use conflict→re-read (not check-then-act alone), and multi-table merges run in **real SQL transactions** (not PostgREST row-at-a-time under service role).

**Do not implement from this chat.**

---

## 1. Method

1. Attack the 2C blueprint with Phase 2A/2B invariants and the observed Airtable ADV-P-1 failure mode.  
2. Inspect existing Supabase migrations (no RLS; public/default table grants pattern) and `supabaseRest` (always **service role**).  
3. Challenge “dedicated `people` schema in the existing Supabase project.”  
4. Classify findings P0–P3; require SQL-level controls.  
5. Revise blueprint for every accepted **P0/P1**.

| Sev | Meaning |
|---|---|
| **P0** | Cross-tenant leak, privilege escalation, duplicate Persons under concurrency, silent SoR corruption, production memory/Airtable fallback |
| **P1** | High-likelihood incomplete merges, deadlock storms, pool exhaustion, audit tamper, secret bleed across envs |
| **P2** | Defense-in-depth / ops clarity |
| **P3** | Documentation polish |

---

## 2. Challenge: “Postgres = safe”

| Assumption | Reality | Classification |
|---|---|---|
| UNIQUE exists ⇒ no duplicates | Only if indexes cover all identity paths (primary + secondary emails + external ids) and writers use conflict handling | **Requires compensating control** |
| RLS on tables ⇒ tenant safe | **Service role bypasses RLS.** Current EA client always uses service role | **P0 if untreated** |
| Same Supabase project is fine | Shared credentials/migrations/PITR blast radius with Simplifi | **Requires compensating control** |
| PostgREST upsert = transactions | Multi-table merge is not atomic via sequential REST calls | **P0 if untreated** |
| Schema separation = isolation | Without REVOKE/GRANT, service role still sees all schemas | **P0 if untreated** |
| Pooler + session locks | Transaction-mode pooler drops session advisory locks across checkouts | **P1** |

---

## 3. Evaluation of the 30 required topics

| # | Topic | Finding | Sev |
|---|---|---|---|
| 1 | Supabase project appropriateness | Existing project is **Simplifi-oriented** (tables `simplifi_*`, flags `SIMPLIFI_OS_*`, service-role REST). Product can be shared; **security boundary must not assume schema name = isolation**. | P0 |
| 2 | Coexistence People + Simplifi | Possible in one project **iff** separate DB roles, schema grants, migration ownership, and PITR/restore runbooks. Else blast-radius / migration collisions. | P0 |
| 3 | Separate Supabase project? | **Not mandatory** if role separation + grant lockdown proven. **Required** when shared service role cannot be split, or cert/prod secret mixing cannot be prevented. Trigger documented in revised blueprint. | P1 |
| 4 | DB roles least privilege | Blueprint underspecified. Need `people_migrator`, `people_app`, `people_readonly_audit`, no shared unrestricted service role on `people`. | P0 |
| 5 | Service-role bypasses RLS | **Confirmed** in `lib/simplifi-os/supabase.ts`. RLS alone is theater under service role. Tenant enforcement must be in **SECURITY DEFINER RPCs** and/or a non-bypass role; RLS remains defense-in-depth for any future limited keys. | P0 |
| 6 | Session-slug → org | Must remain server-only (INV-1). RPCs must take `p_organization_id` only from server after slug resolve — never trust body. | P0 |
| 7 | RLS policies every table | Required as defense-in-depth; **insufficient alone**. Policies keyed by `organization_id` claim only if JWT path exists; under app role without bypass, force `current_setting('people.org_id')`. | P0 |
| 8 | Body tenant ids | Preserve ignore-body-org; reject RPCs that accept client-supplied org without server bind. | P0 |
| 9 | Composite PK/UNIQUE with org | Person PK can be global `person_key` **if** all UNIQUE indexes include `organization_id` for natural keys. | P1 |
| 10 | Partial unique email/external | Must cover **all** emails via `person_email_keys`; empty email excluded; merged tombstones excluded. | P0 |
| 11 | Isolation concurrent create/merge | Ensure: UNIQUE + `INSERT…ON CONFLICT` / 23505→re-read in one txn. Merge finalize: single SQL txn with ordered locks. | P0 |
| 12 | Lock order / deadlock | Spec: lock absorbed then survivor by `person_key` sort order; bounded deadlock retry. | P1 |
| 13 | OCC | `updated_at` or `row_version` on persons; 409 on mismatch (INV-23). | P1 |
| 14 | FK / delete | Prefer **RESTRICT** on person delete; soft-delete/tombstone only; no CASCADE that erases audit. | P1 |
| 15 | Guardian subject-specific | App ACL at evaluation time (INV); DB cannot encode full ACL — must not weaken app checks. | ok |
| 16 | Expiry / majority | Check-time in app (INV-5/6); store DOB encrypted-at-rest where feasible. | P1 |
| 17 | Import PlatformRole ban | App validation (INV-8); DB check constraints cannot list all PlatformRole strings alone — keep app gate + deny columns. | ok |
| 18 | Append-only audit | `REVOKE UPDATE, DELETE`; trigger blocking mutations; no app grant. | P0 |
| 19 | Audit access / tamper | Read via `people_readonly_audit`; hash-chain optional P2; export integrity job. | P1 |
| 20 | Encryption / redaction | Platform disk encryption + INV-25 redaction; app-level field encryption for DOB/legal name **recommended P1** before prod enable if threat model includes DB admin. | P1 |
| 21 | Pooling / exhaustion | Mandatory pooler; max clients; fail-closed on pool timeout (INV-19). | P1 |
| 22 | Secret separation | Distinct service credentials for local / preview / cert / prod; never share prod People role with Simplifi cert. | P0 |
| 23 | Migration privilege | Only `people_migrator` / owner runs DDL; app role has DML only. | P0 |
| 24 | Backup / PITR / restore test | PITR on; restore drill before prod enable. | P1 |
| 25 | Fail-closed DB/pooler down | 503; never empty-success; never memory/Airtable People SoR. | P0 |
| 26 | No Airtable/memory fallback | Adapter forbids Airtable People SoR and prod memory. | P0 |
| 27 | Client Record backfill | One-way; UNIQUE on `(organization_id, client_record_id)` where not null; no dual SoR. | P0 |
| 28 | Rollback partial migration | Flag OFF; retain PG data; no automatic Client Record mutation. | P1 |
| 29 | Cert data isolation | Cert project **or** cert schema + scrub job; never prod org ids in cert. | P1 |
| 30 | Prevent Airtable ADV-P-1 | Partial UNIQUE + conflict path + multi-process SoR query hard stop. | P0 |

---

## 4. Accepted findings (must enter blueprint)

### P0

| ID | Finding | Required fix |
|---|---|---|
| **P0-1** | Service role bypasses RLS; Simplifi client pattern is service-role-only | People runtime **must not** use an unrestricted shared service role over raw tables. Use `people_app` role **without** BYPASSRLS, or **only** SECURITY DEFINER RPCs that bind `organization_id` server-side. |
| **P0-2** | Schema name ≠ isolation | Explicit `REVOKE ALL ON SCHEMA people FROM PUBLIC, anon, authenticated, service_role` then grant least privilege to People roles only. |
| **P0-3** | PostgREST multi-call merge is not ACID | Merge finalize + ensure_person multi-row writes **must** be SQL functions/`BEGIN` blocks — mandatory, not “prefer”. |
| **P0-4** | Secondary email uniqueness underspecified as sole UNIQUE on primary | `person_email_keys` UNIQUE `(organization_id, email_normalized)` for all participating emails; writers maintain table in same txn. |
| **P0-5** | Body/org spoofing if RPC accepts client org | RPCs accept org only from trusted server session resolution; INV-1 tests mandatory. |
| **P0-6** | Memory/Airtable fallback | Explicit adapter ban; INV-19/20/26. |
| **P0-7** | Audit mutable under default grants | REVOKE UPDATE/DELETE; block triggers; no REST update exposure. |
| **P0-8** | Shared Simplifi service key can read/write People if grants loose | Separate People credentials or REVOKE service_role on `people`. |

### P1

| ID | Finding | Required fix |
|---|---|---|
| **P1-1** | Separate Supabase project trigger | Document numeric/ops triggers (cannot split roles; PITR restore would clobber Simplifi; cert/prod secret mixing). |
| **P1-2** | Lock order / deadlock | Sorted person_key locks; retry budget. |
| **P1-3** | Transaction-mode pooler vs session locks | Prefer row locks inside one txn; avoid session advisory locks across pooler checkouts. |
| **P1-4** | OCC on person update | `row_version` or `updated_at` predicate. |
| **P1-5** | FK ON DELETE | RESTRICT / SET NULL carefully; never CASCADE audit away. |
| **P1-6** | DOB/legal name sensitivity | Redaction + optional column encryption before prod enable. |
| **P1-7** | Pool exhaustion | Pooler sizing; fail-closed; metrics. |
| **P1-8** | Cert isolation | Separate cert DB/project or scrubbed schema; no prod tenant data. |
| **P1-9** | PITR restore drill | Gate before production enablement. |
| **P1-10** | `client_record_id` uniqueness | Partial UNIQUE `(organization_id, client_record_id)` WHERE not null and not merged. |

### P2 / P3

- Hash-chained audit (P2).  
- Explicit comment that guardian ACL remains application-layer (P3).  

---

## 5. Scenario attacks (selected)

| Scenario | Prevented after revision? | Control |
|---|---|---|
| 12-process duplicate email (Airtable ADV-P-1 replay) | **Yes** | Partial UNIQUE + 23505→re-read + SoR count cert |
| Service role SELECT * FROM people.persons | **Yes** | REVOKE from service_role; people_app only |
| Attacker sends body.organizationId of victim org | **Yes** | INV-1 + RPC bind |
| Merge updates survivor then crashes before tombstone | **Yes** | Single finalize txn |
| Import assigns PlatformRole | **Yes** | INV-8 app validation |
| Audit row edited via PostgREST | **Yes** | REVOKE + trigger |
| Pooler timeout returns empty directory | **Yes** | Fail-closed INV-19 |
| Dual SoR Client Record + Person drift | **Yes** | One-way link; Airtable remains Client SoR |

---

## 6. Conditions

### Before implementation

1. Blueprint revised with all P0/P1 (this revision).  
2. Database-role matrix and grant/revoke SQL sketched.  
3. Mandatory transactional RPCs for ensure + merge finalize.  
4. Explicit ban on shared unrestricted service_role DML on `people`.  
5. Airtable People SoR adapter marked do-not-commit.  

### Before certification

1. Migrations applied on **isolated cert** Supabase (project or scrubbed DB).  
2. Multi-process ADV-P-1 PASS with direct SQL count = 1.  
3. Service-role cannot DML `people` (negative test).  
4. Body org spoof ADV PASS.  
5. Merge crash/resume + txn rollback ADV PASS.  
6. Fail-closed pooler/DB down ADV PASS.  
7. No memory/Airtable People fallback ADV PASS.  

### Before production enablement

1. Role separation live in prod; secrets not shared with Simplifi cert.  
2. PITR on + restore drill documented.  
3. Pooler sized; monitors green.  
4. INV-26 checklist signed; `UNIVERSAL_PEOPLE` still default OFF until owner enable.  
5. Client Record backfill plan one-way only.  
6. Scale/separation trigger reviewed.  

---

## 7. Final statement

**APPROVED WITH CONDITIONS** — Proceed to security-conditioned design (blueprint revision). Do **not** implement until an explicit implementation prompt after conditions-before-implementation are satisfied in the blueprint.
