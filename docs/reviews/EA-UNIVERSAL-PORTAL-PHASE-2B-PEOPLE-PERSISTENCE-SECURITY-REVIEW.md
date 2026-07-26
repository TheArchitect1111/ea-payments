# EA Universal Portal — Phase 2B People Persistence Security Review

**Document type:** Adversarial architecture & security review (docs only)  
**Subject:** [EA-UNIVERSAL-PORTAL-PHASE-2B-PEOPLE-PERSISTENCE-BLUEPRINT.md](../plans/EA-UNIVERSAL-PORTAL-PHASE-2B-PEOPLE-PERSISTENCE-BLUEPRINT.md)  
**Review date:** 2026-07-26  
**Branch / Phase 2A SHA:** `master` @ `9239bf98d35945463ab3c488a0b41b81318222d2`  
**Scope:** Blueprint review only — **no product code modified**  
**Out of scope:** Tasks, Novu, RJSF, industry portals, OpenFGA deploy, Phase 2B implementation  

---

## Verdict

**APPROVED WITH CONDITIONS**

Airtable remains an **acceptable Phase 2B SoR** for EA’s architecture (Prompt #000 / Integration Gate), **only if** every accepted **P0** and **P1** compensating control in this review is incorporated into the blueprint and proven in persistence certification. Several Airtable limitations are **not** database guarantees; they are **compensating-control requirements**. One limitation (**true serializable uniqueness under unbounded concurrency**) is classified **Requires compensating control** — if certification cannot prove ≤1 authoritative Person under parallel create/ensure, implementation **must stop** and escalate to a different datastore (Phase 2C), not ship with known duplicate risk.

**Do not implement from this chat.**

---

## 1. Method

1. Read Phase 2B persistence blueprint end-to-end.  
2. Cross-check Phase 2A invariants (INV-1…18, ADV-1…22), runtime cert conditions, and Airtable platform patterns (`platform-store`, Trust fail-closed).  
3. Attack each multi-instance / concurrency / migration / ACL scenario.  
4. Score the 24 required blueprint controls.  
5. Challenge “retain Airtable” with explicit limitation classes.  
6. Classify findings P0–P3; revise blueprint for every accepted P0/P1.  

Severity guide:

| Sev | Meaning |
|---|---|
| **P0** | Cross-tenant leak, privilege escalation, silent SoR corruption, or production memory fallback if implemented as originally written |
| **P1** | High likelihood of duplicate Persons, stuck merges, stale ACL, or unrecoverable jobs under real ops |
| **P2** | Defense-in-depth / ops clarity |
| **P3** | Documentation polish |

Limitation classes (Airtable challenge):

| Class | Meaning |
|---|---|
| **Acceptable for Phase 2B** | Limitation understood; residual risk within launch scale |
| **Requires compensating control** | Must be designed + tested before enablement |
| **Blocks implementation** | Cannot proceed until redesigned |
| **Requires a different datastore** | Compensating controls fail cert or scale threshold exceeded |

---

## 2. Control checklist (24 required definitions)

| # | Required control | Present in original 2B? | Post-revision |
|---|---|---|---|
| 1 | One authoritative Person / org + normalized identity | Partial (model yes; normalized email key weak) | **Strengthened** — `OrgEmailKey` / `Person Key` |
| 2 | Durable uniqueness not relying on in-memory check | Claimed; Airtable atomic UNIQUE absent | **Compensating** — upsert keys + conflict re-read + cert |
| 3 | Org scope from session slug only | Yes (INV-1) | Preserved |
| 4 | Fail-closed when Airtable unavailable | Partial | **Strengthened** — INV-19 |
| 5 | No automatic production memory fallback | Stated; illegal flag combo soft | **Strengthened** — INV-20 |
| 6 | Idempotency keys (create/import/merge/migrate/fulfill) | Mostly; manual create weak | **Strengthened** |
| 7 | Durable merge + import job state machines | Yes | Strengthened stages |
| 8 | Recoverable merge without destructive partial completion | Ambiguous finalize ordering | **Strengthened** — INV-21 |
| 9 | Tombstones / redirect for merged People | `mergedIntoPersonId` only | **Strengthened** — INV-22 |
| 10 | Optimistic concurrency / conflict detection | Merge only | **Strengthened** — INV-23 |
| 11 | Retry classification safe / unsafe / terminal | **Missing** | **Added** — §10.5 |
| 12 | Rate-limit bounded retries + backoff | Vague | **Added** — §10.4 |
| 13 | Referential-integrity reconciliation | **Missing** | **Added** — §6.6 |
| 14 | Append-only security audit | App API yes; ops gap | **Strengthened** — INV-24 |
| 15 | Redacted exports **and logs** | Export only | **Strengthened** — INV-25 |
| 16 | Migration checkpoints / restart-safe backfill | Partial | Strengthened |
| 17 | Rollback retains Phase 2A/2B data | Yes (INV-18) | Preserved |
| 18 | Restart persistence tests | Yes | Preserved |
| 19 | Concurrent create → no duplicate authoritative People | Named; proof criteria weak | **Strengthened** — ADV-P-1 |
| 20 | Cross-org fail-closed tests | Inherited ADV | Extended ADV-P-* |
| 21 | Operational recovery for failed jobs | **Missing** | **Added** — §20 |
| 22 | Production monitoring / alert thresholds | **Missing** | **Added** — §20 |
| 23 | Volume/scale threshold to reconsider Airtable | Vague | **Added** — numeric gate |
| 24 | Prohibit `UNIVERSAL_PEOPLE` until persistence cert | Soft | **Hardened** — INV-26 |

---

## 3. Challenge: retain Airtable?

| Limitation | Reality | Classification | Compensating control |
|---|---|---|---|
| No multi-record ACID transactions | Merge spans many tables | **Requires compensating control** | Merge Job state machine; archive absorbed only in finalize after all steps; retry idempotent |
| No true SQL UNIQUE under concurrent INSERT | Two creates can both pass filterByFormula | **Requires compensating control** | Composite upsert fields (`OrgEmailKey`, `OrgExternalKey`); create-or-return; concurrency cert **hard stop** if duplicates appear |
| Eventual / stale formula index visibility | Brief windows where lookup misses new row | **Requires compensating control** | Short retry on conflict; no cross-request cache for uniqueness or ACL |
| Rate limits (5 req/s/base typical) | Backfill / merge storms | **Requires compensating control** | Bounded backoff; throttle; alerts; scale threshold |
| Admin UI can edit/delete Audit | App append-only insufficient alone | **Requires compensating control** | No app mutate APIs; ops ACL; periodic integrity export; hash-chain optional (P2) |
| FilterByFormula soft-fail / missing fields | Empty results misread as “no person” | **Requires compensating control** | Distinguish transport errors vs empty; fail-closed on 5xx/429 exhausted |
| JSON-in-longText for emails/phones | Malformed payloads | **Requires compensating control** | Schema validate on read/write; reject malicious shapes |
| No FK cascades | Orphan edges after crash | **Requires compensating control** | Reconciliation job; cert for orphan rate |
| Horizontal scale beyond Airtable comfort | Large orgs / high write QPS | **Acceptable for Phase 2B** until threshold; then **Requires a different datastore** | Numeric scale gate (§20.3) |

**Conclusion:** Do **not** reject Airtable for Phase 2B a priori. Reject **shipping without** uniqueness/merge/fail-closed compensating controls and certification. Do **not** introduce Postgres People SoR in 2B unless cert fails uniqueness/concurrency (then Phase 2C — Integration Gate exception required).

---

## 4. Scenario matrix (adversarial)

Legend: **Prevents?** = after blueprint revision.

| # | Scenario | Prevents? | Control | Original gap | Correction | Required test | Sev |
|---|---|---|---|---|---|---|---|
| 1 | Multi-instance ensure same Client Record → 2 Persons | **Yes*** | Upsert keys + conflict re-read | In-memory check assumed | INV-3 durable; ADV-P-1 | ADV-P-1 | **P0** |
| 2 | Concurrent staff create same email | **Yes*** | `OrgEmailKey` upsert / 409→re-read | Primary Email lookup race | §6.1, §8.2 | ADV-P-1b | **P0** |
| 3 | Concurrent household / relationship edits | **Yes** | Per-edge upsert keys; person OCC | Underspecified | §10.6 | ADV-P-2 | **P1** |
| 4 | Duplicate import retries | **Yes** | Import Job + row keys | Present | §10.2 | ADV-14/P-3 | P1→ok |
| 5 | Out-of-order / interrupted merge | **Yes** | Ordered stages; no archive until finalize | Finalize could run early | INV-21 | ADV-P-4 | **P0** |
| 6 | Partial Airtable write mid-merge | **Yes** | Job `failed`/`retryable`; no destructive complete | Ambiguous | §10.1, §10.5 | ADV-P-4 | **P0** |
| 7 | Rate limit / timeout storms | **Yes** | Bounded backoff; terminal after N | Vague | §10.4 | ADV-P-5 | **P1** |
| 8 | Stale read shows pre-majority / pre-expiry | **Yes** | ACL never uses cross-request cache | Cache allowed vaguely | INV-27 | ADV-P-6 | **P0** |
| 9 | Out-of-order retry re-applies merge step | **Yes** | Idempotent step keys | Weak | §10.1 | ADV-P-4 | **P1** |
| 10 | Server restart mid-job | **Yes** | Durable job status; resume | Present | §10.1 | Restart + ADV-P-4 | ok |
| 11 | Malformed / malicious Airtable JSON | **Yes** | Validate on read; fail closed | Missing | INV-28 | ADV-P-7 | **P1** |
| 12 | Cross-org attack via body/job ids | **Yes** | Session slug→org; job org bind | Present INV-1 | INV-1 + job org | ADV-1/11/P-8 | P0→ok |
| 13 | Guardian edge changed concurrently | **Yes** | Access-time evaluation; OCC on edge | Present INV-5 | INV-5 + §10.6 | ADV-4/5 | ok |
| 14 | Expired grant still honored | **Yes** | Check-time expiry | Present | INV-5 | ADV-5 | ok |
| 15 | Dependent reaches majority | **Yes** | Check-time majority | Present | INV-6 | ADV-6 | ok |
| 16 | Client Record backfill duplicates | **Yes** | Checkpoint + external id | Present | §8 | ADV-14/P-9 | ok |
| 17 | Rollback after partial migration | **Yes** | Flag OFF retain; no purge | Present INV-18 | INV-18 | ADV-22 | ok |
| 18 | Export / log leaks DOB | **Yes** | Redact export **and** logs | Logs missing | INV-25 | ADV-18/P-10 | **P0** |
| 19 | Audit tampering via API | **Yes** | Append-only API | Present | INV-15/24 | ADV-19 | ok |
| 20 | Import elevates PlatformRole | **Yes** | Import caps | Present INV-8 | INV-8 | ADV-8/12 | ok |
| 21 | Persist OFF + People ON in prod → memory SoR | **Yes** | Illegal combo fail-closed | Soft | INV-20 | ADV-P-11 | **P0** |
| 22 | Airtable down → silent empty directory | **Yes** | Distinguish error vs empty; 503 | Soft-fail risk | INV-19 | ADV-P-12 | **P0** |
| 23 | GET absorbed person id after merge | **Yes** | Tombstone redirect | Underspecified | INV-22 | ADV-P-13 | **P1** |
| 24 | Enable People before persistence cert | **Yes** | INV-26 hard gate | Soft | INV-26 | Gate checklist | **P0** |

\*“Yes” contingent on **concurrency certification hard stop** (duplicates ⇒ Blocks / different datastore).

---

## 5. Finding detail (accepted P0 / P1)

### P0-1 — Airtable cannot atomically enforce uniqueness
**Risk:** Dual authoritative Persons for same email/Client Record across instances.  
**Fix:** Composite upsert keys (`OrgEmailKey`, `OrgExternalKey`); create-or-re-read; **ADV-P-1 hard stop** if duplicates observed.

### P0-2 — Destructive merge finalize ordering
**Risk:** Absorbed archived while edges/ACL still point at absorbed → access holes / orphans.  
**Fix:** INV-21 — archive + `mergedIntoPersonId` only in finalizing after all copy/rewrite steps succeed.

### P0-3 — Production memory fallback / illegal flag combo
**Risk:** `UNIVERSAL_PEOPLE=1` with persist OFF → multi-instance split-brain SoR.  
**Fix:** INV-20 — production/preview reject People ON unless Persist ON (or routes stay 404).

### P0-4 — Soft-fail Airtable reads treated as empty
**Risk:** Cross-tenant or auth bypass illusions; duplicate creates.  
**Fix:** INV-19 — transport/schema errors fail closed (5xx); never “not found” on dependency failure.

### P0-5 — ACL / expiry evaluated on stale cache
**Risk:** Guardian retains access after expiry/majority.  
**Fix:** INV-27 — no cross-request cache for ACL input rows.

### P0-6 — Logs leak sensitive fields
**Risk:** DOB / emails in `console.error` / job meta.  
**Fix:** INV-25 — shared redaction for logs and export.

### P0-7 — Enable before persistence cert
**Fix:** INV-26 — `UNIVERSAL_PEOPLE` production enable forbidden until 2B runtime cert PASS (or PASS WITH CONDITIONS that do not waive uniqueness).

### P1-1 — Missing retry taxonomy
**Fix:** §10.5 safe / unsafe / terminal.

### P1-2 — Missing rate-limit bounds
**Fix:** §10.4 max attempts, cap backoff, terminal `failed_rate_limit`.

### P1-3 — Missing referential reconciliation
**Fix:** §6.6 ops/cron reconciliation + alert on orphan count.

### P1-4 — Optimistic concurrency only on merge
**Fix:** INV-23 — OCC on Person (and critical edge) updates.

### P1-5 — Merge tombstone/redirect underspecified
**Fix:** INV-22 — GET by absorbed id returns redirect/survivor per ACL.

### P1-6 — Malformed stored JSON
**Fix:** INV-28 — validate on read/write.

### P1-7 — No ops recovery runbook / monitoring / scale gate
**Fix:** §20 recovery, alerts, numeric Airtable reconsider threshold.

### P1-8 — Secondary emails not in uniqueness key
**Fix:** Normalize uniqueness on **all** emails in org (or forbid secondary-as-primary collision); document `OrgEmailKey` derivation.

---

## 6. P2 / P3 (tracked, not blocking)

| ID | Note | Sev |
|---|---|---|
| P2-1 | Hash-chained audit for tamper evidence beyond Airtable ACL | P2 |
| P2-2 | Dedicated External Identity table (one row per triple) vs JSON array | P2 |
| P2-3 | Merge job lease / heartbeat to detect stuck workers | P2 |
| P3-1 | Update prerequisite SHA (2A now shipped) | P3 |

---

## 7. Blueprint revisions applied

Written into the Phase 2B blueprint:

1. Updated prerequisite to Phase 2A commit `9239bf98…`.  
2. **NEW §18** — Phase 2B security invariants INV-19…INV-28.  
3. **NEW §19** — Persistence adversarial matrix ADV-P-1…ADV-P-13.  
4. **NEW §20** — Operational recovery, monitoring, scale threshold.  
5. Strengthened §6 uniqueness keys, §6.6 reconciliation, §7.3 fail-closed selection, §10 merge finalize, §10.4–10.6 retries/OCC/households.  
6. Hardened §11 / §14 / §15 enablement gates.  
7. Airtable limitation classification table (§2.4).  

---

## 8. Verdict conditions

### Before implementation may start

1. Implementers treat **§18 INV-19…INV-28** and Phase 2A **INV-1…18** as non-negotiable.  
2. Composite uniqueness / upsert key schema is designed before adapter coding.  
3. Merge finalize ordering (INV-21) is in the job design before merge coding.  
4. Illegal production flag combo (INV-20) is specified in flag matrix.  
5. No Tasks / Novu / RJSF / OpenFGA install / second Airtable client / Postgres People SoR in 2B.  

### Before production enablement (`UNIVERSAL_PEOPLE=1` in a shared/prod environment)

1. Phase 2B persistence runtime certification **PASS** (or PASS WITH CONDITIONS that **do not** waive ADV-P-1 uniqueness).  
2. ADV-1…22 + ADV-P-1…P-13 automated against Airtable adapter (test base).  
3. Restart + multi-instance read-after-write proven.  
4. Concurrent ensure/create proves **exactly one** authoritative Person (hard stop on duplicates).  
5. Fail-closed proven when Airtable unavailable (no memory fallback).  
6. Monitoring + alert thresholds configured (§20).  
7. Failed-job recovery runbook executed once in dry-run.  
8. Scale thresholds documented; traffic below reconsider gate.  
9. `UNIVERSAL_PEOPLE` remains default **OFF** in env examples; enablement is explicit ops change.  
10. Legal reacceptance reachability still documented (portal-wide).  

### Escalation to different datastore (Phase 2C)

If ADV-P-1 fails after compensating controls, or scale threshold in §20.3 is exceeded with sustained 429s — **stop enabling People**; open Integration Gate exception for Postgres dual-write / SoR. Do **not** “accept duplicates” as a condition.

---

## Verdict (repeat)

**APPROVED WITH CONDITIONS**
