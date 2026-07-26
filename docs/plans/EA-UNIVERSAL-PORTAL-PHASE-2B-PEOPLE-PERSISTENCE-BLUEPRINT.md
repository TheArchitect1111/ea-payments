# EA Universal Portal — Phase 2B Blueprint
## People Persistent Storage

**Status:** Blueprint only — **do not implement from this chat without an explicit implementation prompt**  
**Date:** 2026-07-26 (revised after adversarial security review)  
**Phase 1 baseline SHA:** `c1bbc78260ef7cede436146741c5af1e4a874d6d`  
**Phase 2A shipped SHA:** `9239bf98d35945463ab3c488a0b41b81318222d2` (`feat: add universal people foundation`)  
**Phase 2A prerequisite:** People foundation (in-memory) + ADV-1…22 + runtime cert **PASS WITH CONDITIONS** — **shipped** on `origin/master`  
**Security review:** [EA-UNIVERSAL-PORTAL-PHASE-2B-PEOPLE-PERSISTENCE-SECURITY-REVIEW.md](../reviews/EA-UNIVERSAL-PORTAL-PHASE-2B-PEOPLE-PERSISTENCE-SECURITY-REVIEW.md) — **APPROVED WITH CONDITIONS**  
**Predecessor docs:**
- [EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-BLUEPRINT.md](./EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-BLUEPRINT.md)
- [EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-SECURITY-REVIEW.md](../reviews/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-SECURITY-REVIEW.md)
- [EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-RUNTIME-CERTIFICATION.md](../reports/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-RUNTIME-CERTIFICATION.md)
- [PROMPT-000-ARCHITECTURE-GATE.md](../PROMPT-000-ARCHITECTURE-GATE.md)
- [INTEGRATION-GATE.md](../INTEGRATION-GATE.md)
- [EA-CHASSIS-STORAGE.md](../EA-CHASSIS-STORAGE.md)

> **Security revision note:** §§2.4, 6.1, 6.6, 7.3, 10.1–10.6, 11, 14–15, and **NEW §§18–20** incorporate every accepted **P0/P1** finding from the Phase 2B persistence security review. Implementation stop gates in §14 and §18 INV-26 are mandatory.

**Launch impact:** Without durable People storage, `UNIVERSAL_PEOPLE=1` is unsafe on multi-instance Vercel (cold start / split-brain). Phase 2B is the production gate for the People module.

**Out of scope (explicit):** Tasks, Novu, RJSF, industry-specific portal packs, full OpenFGA install, replacing Client Records as commerce SoR, Connect→People bulk sync, binary document store.

---

## 0. Architecture gate (before any implementation)

| Question | Answer |
|---|---|
| Does this increase platform capacity? | **Yes** — durable multi-persona directory across instances |
| Does this increase simplicity / reusability? | **Yes if** we persist through existing Airtable/`platform-store` patterns; **No if** we add a second OLTP SoR for portal identity |
| Rebuild vs refactor? | **Refactor** `lib/people/store.ts` behind a repository adapter; keep ACL/merge/ensure domain logic |
| New microservice / new DB product? | **Reject** as default (Integration Gate) |

---

## 1. Current-state audit (repository capability)

### 1.1 Authoritative production stores today

| Domain | Store | Primary modules |
|---|---|---|
| Organizations | Airtable `Organizations` | `lib/organizations.ts`, `lib/platform-store.ts` |
| Client Records (commerce + portal credentials) | Airtable `Client Records` | `lib/airtable.ts`, `lib/portal-access.ts` |
| Portal Memberships (`PlatformRole`) | Airtable `Memberships` | `lib/memberships.ts` |
| Entitlements | Airtable `Entitlements` | `lib/entitlements.ts` |
| CTP submissions / workspace payload | Airtable `CTP Submissions` | `lib/ctp-submissions.ts` |
| Pulse / Activity | Airtable `Pulse Events` / `ActivityEvents` | `lib/pulse-event-store.ts`, `lib/activity-events-store.ts` |
| Trust / legal acceptances + audit | Airtable `Legal Acceptances`, `Legal Audit Events` | `lib/trust-engine/*` |
| Connect CRM | Airtable Connect tables | `lib/connect-store.ts` |
| Creative Studio / factory | Airtable `Creative Studio` | `lib/creative-studio/persistence.ts` |
| Stripe | Stripe API | checkout / webhooks / `lib/subscription-sync.ts` |
| Sessions | Stateless HMAC cookies | `@ea/portal-chassis/hmac`, `ADMIN_SESSION_SECRET` |
| Simplifi Opportunity OS (optional) | Supabase/Postgres (flag-gated) | `lib/simplifi-os/*`, `supabase/migrations/` |
| **People (Phase 2A)** | **Process memory only** | `lib/people/store.ts` |

### 1.2 What is *not* in the repo as production OLTP

- No Prisma / Drizzle / Knex
- No `DATABASE_URL` / Redis / Vercel KV / Neon / Turso / SQLite app store
- No OpenFGA packages (projector stub only — must stay non-authoritative)
- Supabase is **Simplifi-scoped**, default read/write **OFF**

### 1.3 Airtable patterns to reuse

- Unified HTTP client: `lib/data/airtable-client.ts` (`airtableQuery` / `Create` / `Update` / `UpsertByField`)
- Platform facade: `lib/platform-store.ts`
- Idempotent upsert-by-field: Creative Studio, CTP Submissions
- Fail-closed production vs explicit local fallback: Trust Engine `persistence-mode.ts`
- Org scoping: durable Airtable org record ids; reject synthetic `org_*` writes in production

### 1.4 Capability classification

| Class | Items |
|---|---|
| **Existing repository capability** | Airtable SoR; `platform-store`; Memberships/Entitlements upsert patterns; Trust fail-closed mode; HMAC sessions; Phase 2A domain (types, ACL, merge, ensure, import/export, guards, ADV suite); `UNIVERSAL_PEOPLE` flag; fulfill hook (flag-gated) |
| **Reusable capability requiring modification** | `lib/people/store.ts` → repository interface + Airtable adapter; `merge.ts` (incomplete vs blueprint: household/ACL/externalIds); `ensure-person` / migrate for durable uniqueness; `platform-store` table constants; fulfill + **org-provision** wiring; schema verify scripts |
| **Missing capability** | Durable People tables; uniqueness constraints that survive multi-instance; merge/import job state machines; optimistic concurrency; persistence adapter for tests; restart/cert harness; retention jobs; rate-limit/backoff policy for People writes |
| **Recommended new work (2B only)** | People repository + Airtable tables + job tables + flags + migrations + tests/cert — **not** a new database product |

---

## 2. Datastore decision

### 2.1 Options evaluated

| Option | Fit to EA | Tenant isolation | Transactional safety | Query needs | Cost / ops | Migration risk | Scale |
|---|---|---|---|---|---|---|---|
| **A. Airtable via `platform-store`** | **Best** — same SoR as Orgs, Memberships, Client Records, fulfill | Org Id on every row (existing pattern) | **Weak** — no multi-record ACID; must compensate with jobs + idempotency | FilterByFormula + indexed unique fields; adequate for directory scale | Already paid / known | Low — same base, additive tables | Fine for launch orgs; watch rate limits |
| **B. Supabase/Postgres (new People schema)** | Poor for 2B — second SoR beside Client Records/Memberships; Simplifi OS not activated for portal identity | Strong if RLS designed | Strong | Strong | New ops surface; Integration Gate | High — dual-write or cutover | Stronger long-term |
| **C. New DB product (Neon/Turso/etc.)** | Reject — Integration Gate (does not replace Airtable; adds stack) | N/A | Strong | Strong | Highest complexity | Highest | Premature |
| **D. Chassis Objects JSON only** | Possible but weak | Org Id | Weak | Poor uniqueness / guardian queries | Low | Medium | Poor |
| **E. Stay in-memory** | Reject for production (PROMPT-000 red flag) | Broken across instances | N/A | N/A | Free | N/A | Unsafe |

### 2.2 Integration Gate on “new Postgres for People”

| # | Question | Score |
|---|---|---|
| 1 Replace | **No** — does not retire Airtable; would duplicate identity-adjacent data |
| 2 Reduce work | Partial — safer merges, but more ops |
| 3 Invisible | Yes |
| 4 Fit | Partial — Simplifi OS extension point exists, but portal identity is Airtable |
| 5 Simplify | **No** — two OLTP systems for related tenant graphs |

**Decision: Reject Postgres-as-People-SoR for Phase 2B.** Revisit only if Airtable compensating controls fail runtime concurrency/rate certs (Phase 2C candidate — dual-write brain — not this blueprint). **Duplicates under ADV-P-1 are not an acceptable production condition.**

### 2.3 Recommended authoritative datastore

**Airtable (same payments base), accessed only through `lib/data/airtable-client.ts` / `lib/platform-store.ts`.**

**Why it fits EA**

1. Prompt #000: postpone Airtable replacement; one Airtable client; production tenant data must not be memory-only.
2. Person rows must reference **Client Record ids**, **Organization ids**, and optionally Membership emails already stored in Airtable.
3. Fulfill chain already writes Airtable; People ensure must be durable in that same chain.
4. Cost and backup posture already operational for EA.
5. Phase 2A blueprint §17.4 already named these tables — 2B implements that intent with concurrency realism.

**What we refuse to pretend**

Airtable is **not** a transactional RDBMS. Phase 2A in-memory merge/uniqueness assumptions **do not safely survive** multi-instance without redesign (see §4). Airtable **does not** provide SQL-grade atomic UNIQUE under concurrent INSERT — uniqueness is a **compensating-control requirement**, not a platform guarantee (see §2.4).

### 2.4 Airtable limitation classification (security review)

| Limitation | Class | Required response |
|---|---|---|
| No multi-record ACID | **Requires compensating control** | Merge/Import job machines; INV-21 finalize ordering |
| No atomic UNIQUE on concurrent create | **Requires compensating control** | `OrgEmailKey` / `OrgExternalKey` upsert + conflict re-read; ADV-P-1 hard stop |
| Stale index / read-your-writes lag | **Requires compensating control** | Retry on conflict; INV-27 no ACL cache |
| Rate limits / timeouts | **Requires compensating control** | §10.4 bounded backoff; §20 alerts; scale gate |
| Admin can mutate Audit in UI | **Requires compensating control** | INV-15/24 app append-only; ops ACL; export integrity |
| Soft-fail empty vs error | **Requires compensating control** | INV-19 fail-closed on transport errors |
| Malformed JSON fields | **Requires compensating control** | INV-28 validate on read/write |
| Orphan edges without FKs | **Requires compensating control** | §6.6 reconciliation |
| Sustained high QPS / large tenants | **Acceptable for Phase 2B** until §20.3; then **Requires a different datastore** | Phase 2C Integration Gate |

If ADV-P-1 fails after controls → class upgrades to **Blocks implementation** / **Requires a different datastore** (do not enable People).

---

## 3. Authoritative Person model (unchanged semantics)

One Person per human (or org contact) **per organization**. Roles and relationships express persona — not separate person tables.

Canonical TypeScript remains `lib/people/types.ts` (Phase 2A). Persistence must round-trip these types without semantic drift.

### 3.1 Required persistent models

| Model | Purpose | Airtable table (proposed title) |
|---|---|---|
| **Person** | Directory root | `People` |
| **PersonDirectoryMembership** | Org directory roles (≠ portal Membership) | `People Org Memberships` |
| **Household** | Family/household container | `People Households` |
| **HouseholdMember** | Membership + authorized-rep window | `People Household Members` |
| **PersonRelationship** | Person↔person edges (`guardian_of`, etc.) | `People Relationships` |
| **PersonProgramLink** | Pointers to CTP/Simplifi/etc. | `People Program Links` |
| **PersonConsent** | Purpose-scoped consent | `People Consents` |
| **PersonAclGrant** | Thin object ACL | `People ACL Grants` |
| **PeopleAuditEvent** | Append-only audit | `People Audit` |
| **PeopleMergeJob** | Durable merge state machine | `People Merge Jobs` (**new vs 2A**) |
| **PeopleImportJob** | Durable import batch | `People Import Jobs` (**new vs 2A**) |
| **PeopleImportRowResult** | Per-row import outcomes | `People Import Row Results` (**new vs 2A**) |

Guardian/dependent access is **not** a separate table: it is derived at access time from:

1. `PersonRelationship` (`guardian_of` / mirrors) and/or `PersonAclGrant`, **and**
2. `PersonConsent` where required by purpose, **and**
3. Expiry fields + majority evaluation (`PEOPLE_MAJORITY_AGE` / DOB / `isMinor`) in `acl.ts` (**INV-5, INV-6**).

Household membership alone **never** grants child access (Phase 2A security condition — preserve).

### 3.2 Person field persistence map

| Domain field | Airtable field (illustrative) | Notes |
|---|---|---|
| `id` | `Person Key` (text, unique) **or** Airtable record id mapped 1:1 | Prefer stable `person_*` key in a dedicated field so ids survive export/import; store Airtable `recordId` as secondary |
| `organizationId` | `Organization Id` | Immutable (**INV-2**); never accept from client body |
| `portalSlug` | `Portal Slug` | Denormalized for ops; not tenant authority |
| `displayName`, names | text fields | |
| `emails` | `Emails JSON` + `Primary Email` + **`OrgEmailKey`(s)** | Normalized keys for **all** emails; durable uniqueness (**P0-1**) |
| `phones` | `Phones JSON` | |
| `dateOfBirth`, `isMinor` | date / checkbox | Majority re-evaluated at access time (**INV-27**: no ACL cache) |
| `externalIds` | `External Ids JSON` + `Client Record Id` + **`OrgExternalKey`(s)** | Unique triple via upsert key |
| `lifecycleStatus` | single-select | active/inactive/archived/deceased |
| `mergedIntoPersonId` | text Person Key | Tombstone redirect (**INV-22**) |
| `source`, audit emails, timestamps | fields | `Updated At` for OCC (**INV-23**); `Merge Job Id` during merge |

---

## 4. Phase 2A behaviors that cannot safely survive persistence as-is

Challenge the in-memory design explicitly:

| Phase 2A behavior | Failure under persistence / multi-instance | 2B requirement |
|---|---|---|
| Module-level `Map` store | Empty after cold start; different on each serverless instance | Airtable SoR + optional short TTL read cache **never** authoritative |
| Check-then-act email uniqueness | Two instances create duplicate Persons | Unique lookup + upsert; conflict → return existing or reject with 409 |
| Check-then-act external id uniqueness | Same | Unique `(Organization Id, External System, External Value)` enforcement path |
| `mergePersons` single-process mutation | Partial writes leave split graph; retries duplicate relationship copies | **Merge Job** state machine; idempotent steps; survivor lock |
| Merge does not move household members / ACL / external ids | Absorbed remains partially live | Complete merge steps before job `completed` |
| Audit in-process array | Lost on restart; INV-18 false across instances | Durable `People Audit`; append-only API |
| Flag OFF “retain data” | Only true within one process today | Retention in Airtable regardless of flag |
| Synthetic `people_org_${slug}` / test org map | Divergent tenants | Production: resolve org only via Organizations; reject synthetic writes |
| Relationship merge “create new, leave old” | Graph pollution under retry | End/rewrite edges idempotently; dedupe key |
| Import without job record | Duplicate imports on retry | Import Job + row idempotency keys |
| OpenFGA projector as future authority | Temptation to “fix” ACL with DB | Keep projector non-authoritative (**INV-16**) |

**Stop gate:** If implementation cannot express merge as a durable job with idempotent steps, do **not** enable People in production.

---

## 5. Security invariants (must preserve)

All Phase 2A **INV-1…INV-18** and **ADV-1…ADV-22** remain mandatory after persistence.

Highlights for storage design:

| Invariant | Persistence implication |
|---|---|
| **INV-1** | Every write uses `organizationId` from `resolvePeopleTenantFromSlug(session.slug)` only; strip body `organizationId` |
| **INV-2** | Adapter rejects any update that changes `Organization Id` |
| **INV-3** | Uniqueness scoped by Organization Id (+ active/non-merged lifecycle rules) |
| **INV-4 / INV-8** | Directory roles never write `Memberships.role` / PlatformRole; import caps unchanged |
| **INV-5 / INV-6** | Expiry + majority evaluated in `acl.ts` at read time — **do not** bake “forever guardian” into stored booleans |
| **INV-9 / INV-10** | Soft statuses; no cascade delete; archived/deceased visibility rules unchanged |
| **INV-11 / INV-12** | Unique external triple; Client Records never deleted by People; single ensure upsert |
| **INV-14** | Export only through `redactPersonForActor` |
| **INV-15** | Audit append-only; no update/delete APIs |
| **INV-16** | `acl.ts` must not import `authz-port`; no OpenFGA install |
| **INV-17 / INV-18** | Flag default OFF; APIs 404 when OFF; **data retained in Airtable** |

Cross-organization reads/writes/searches/exports/merges/relationship creates **fail closed**.

---

## 6. Database constraints, indexes, soft-delete, retention

Airtable cannot express true FKs/transactions. Emulate with field design + application enforcement + verify scripts.

### 6.1 Logical constraints (enforced in adapter + schema verify)

| Constraint | Rule |
|---|---|
| Person org immutable | Updates cannot change `Organization Id` |
| Email uniqueness (durable) | **`OrgEmailKey`** = `organizationId + '#' + normalize(email)` for **every** email on the person (primary and secondary). Store as indexed field(s) or child External Email rows. Uniqueness among non-merged, non-archived/deceased. **Must not** rely on in-memory check-then-act alone (**P0-1**). |
| External id uniqueness | **`OrgExternalKey`** = `organizationId + '#' + system + '#' + value` among non-merged |
| Directory membership | At most one row per `(Organization Id, Person Key)` — upsert |
| Program link | Unique `(Organization Id, Person Key, Kind, External Ref)` — upsert |
| Household member | Unique `(Household Id, Person Key)` — upsert |
| Active guardian edge | Unique `(From, To, Type, Status=active)` via upsert key |
| Merge job | Unique active/completed mapping per `(Organization Id, Absorbed Person Key)` |
| Import job | Idempotency key unique per org |
| Manual create | Same email path as ensure: upsert-or-409; client may supply `Idempotency-Key` header |
| Audit | Insert-only (INV-15 / INV-24) |

**Normalized identity:** `normalize(email)` = trim + lower-case. Display names are not uniqueness keys.

### 6.2 Recommended indexes / lookup fields

Airtable: create **indexed** fields used in `filterByFormula` / upsert-by-field:

- `People`: `Organization Id`, `Person Key`, `Primary Email`, `OrgEmailKey` (or linked email keys), `Client Record Id`, `OrgExternalKey` (or external child table), `Lifecycle Status`, `Merged Into Person Key`, `Updated At`, `Merge Job Id`
- `People Relationships`: `Organization Id`, `From Person Key`, `To Person Key`, `Type`, `Status`, `Edge Key`
- `People ACL Grants`: `Organization Id`, `Resource Type`, `Resource Id`, `Grant Key`
- Job tables: `Organization Id`, `Status`, `Idempotency Key`, `Updated At`

### 6.3 Soft deletion

| Action | Behavior |
|---|---|
| Archive person | `lifecycleStatus=archived`; retain all child rows |
| Decease | `deceased` + `deceasedAt`; retain links/audit; marketing/list hide per INV-9/10 |
| End relationship / membership | status `ended`; keep row |
| Merge absorb | set `mergedIntoPersonId` + archive **only in finalize** (INV-21); never hard-delete |
| Tombstone / redirect | Absorbed row remains queryable as redirect to survivor (INV-22) |
| Hard delete | **Not in 2B product APIs.** Ops-only retention purge (below) |

### 6.4 Retention / backups

| Data | Retention |
|---|---|
| Active/inactive persons + graph | Indefinite while org active |
| Archived / merged / deceased | Retain ≥ 7 years or org contract max (document in Trust Center later); not purged by flag OFF |
| Audit events | Append-only; same retention floor as legal audit posture |
| Import row results | ≥ 1 year (dispute/debug) |
| Merge jobs | Retain completed/failed jobs ≥ 1 year |
| Backups | Rely on Airtable workspace backup / EA ops export; add `scripts/export-people-org.mts` for tenant export |

### 6.5 Audit requirements

Every protected mutation writes `People Audit` **before** returning success to client when feasible; on multi-step jobs, write step audits and a final `people.merge` / `people.import` summary.

Forbidden: update/delete audit rows via app APIs (keep throwing stubs). Ops must restrict Airtable UI edit on `People Audit` (INV-24).

**Log redaction (INV-25):** Job `meta`, `console.error`, and metrics labels must run through the same redaction helper as exports (no raw DOB / full secondary PII dumps).

### 6.6 Referential-integrity reconciliation (Airtable has no FKs)

Periodic (cron or admin script) reconciliation **per organization**:

1. Relationships / household members / ACL / program links whose Person Keys are missing → mark `orphaned` or quarantine; alert.
2. Absorbed persons without `mergedIntoPersonId` after job `completed` → alert (invariant break).
3. Active guardian edges to non-minor adults (majority) → leave edges but ACL denies (INV-6); optional ops report.
4. Duplicate `OrgEmailKey` among non-merged → **P0 page**; block further creates for that key until ops merge.

Reconciliation never auto-deletes Persons. Alert thresholds in §20.

---

## 7. Adapter boundary

### 7.1 Target architecture

```
API / fulfill / migrate
        ↓
  domain services (acl, merge, ensure, import-export)  ← unchanged contracts
        ↓
  PeopleRepository (interface)
        ├── MemoryPeopleRepository   (tests + CERT_MEMORY=1 only)
        └── AirtablePeopleRepository (production when persistence enabled)
        ↓
  platform-store / airtable-client
```

### 7.2 Interface (conceptual)

Port the Phase 2A `store.ts` exports into `lib/people/repository.ts` (names illustrative):

- Person CRUD + finders
- Directory upsert/list
- Household create/members
- Relationships / program links / consents / ACL grants
- `appendPeopleAudit` / `listPeopleAudit`
- Job APIs: `createMergeJob`, `updateMergeJob`, `createImportJob`, …

**Test-only:** `resetPeopleStoreForTests` remains on memory adapter only.

### 7.3 Selection rules

| Environment | Adapter |
|---|---|
| Unit / ADV tests | Memory (default in test runners) |
| Local without Airtable | Memory **only if** `UNIVERSAL_PEOPLE_PERSIST` is OFF; if Persist ON without credentials → **fail closed** (no silent memory) |
| Preview / production | If `UNIVERSAL_PEOPLE=1`: **require** `UNIVERSAL_PEOPLE_PERSIST=1` and Airtable configured → Airtable only. **Illegal combo** People ON + Persist OFF → treat as People OFF (404) or hard boot error — **never** memory SoR (**INV-20**). |
| Airtable unavailable with Persist ON | All People reads/writes **fail closed** (503 / dependency error) — **never** empty success, **never** memory (**INV-19**) |

### 7.4 Caching

Optional **per-request** memoization allowed.

Cross-request memory caches:

- short TTL only for non-ACL list hints if used at all, and
- **never** the SoR, and
- **forbidden** for inputs to `assertPeopleAccess` (guardian, expiry, majority, lifecycle) — **INV-27**, and
- **forbidden** for uniqueness lookups that gate creates (use Airtable + conflict retry).

---

## 8. Migration from Client Records (no duplicates)

### 8.1 Principles

- Client Record remains **commerce / portal login SoR**.
- People is **directory / relationship SoR**.
- Never delete or rewrite Client Record identity fields as part of People migration.
- Single upsert function: `ensurePersonForClientRecord` (**INV-12**).

### 8.2 Upsert algorithm (durable)

For org O and Client Record C:

1. If flag OFF → no-op.
2. If Persist ON and Airtable errors → fail closed for ensure path when called from People APIs; fulfill logs redacted non-fatal (**INV-19**).
3. Lookup Person by `OrgExternalKey` `(O, client-record, C.id)`.
4. Else lookup by each normalized email `OrgEmailKey` among non-merged active/inactive in O.
5. If found without external id → attach `client-record` external id (idempotent patch + OCC).
6. Else create Person via upsert-or-re-read (`source: client-record-migration|provisioning`) with org from slug resolution only.
7. Upsert directory membership (`client` role default) with `clientRecordId`.
8. Upsert program links for CTP refs if provided.
9. On any unique conflict → re-read and return existing (no second create). **Never** check-then-act only in memory.

### 8.3 Batch migration

- Job type `PeopleImportJob` with `source=client-record-backfill`.
- Process in pages; checkpoint last Client Record id.
- Dry-run mode counts would-create vs would-link.
- Partial failure: retry from checkpoint; never double-create thanks to external id + email uniqueness.

### 8.4 Org-provision gap

Phase 2A wired fulfill only. Phase 2B must also call ensure from org-provision paths **behind the same flag**, same upsert function.

---

## 9. Idempotency and rollback

### 9.1 Idempotency keys

| Operation | Key |
|---|---|
| Ensure from Client Record / fulfill | `(organizationId, client-record, clientRecordId)` |
| Manual create | `OrgEmailKey` upsert **or** client `Idempotency-Key` scoped to org+actor |
| Program link | `(organizationId, personId, kind, externalRef)` |
| Directory membership | `(organizationId, personId)` |
| Relationship edge | `Edge Key` = org+from+to+type |
| Merge job | `(organizationId, absorbedPersonId)` — one active/completed survivor mapping |
| Merge job step | `(mergeJobId, stepName)` — re-run safe |
| Import job | Client-supplied or hash`(org, fileChecksum, actor)` |
| Import row | `(importJobId, rowNumber)` or `(importJobId, OrgEmailKey)` |
| Migration checkpoint | `(orgId, backfillJobId, lastClientRecordId)` |

### 9.2 Rollback rules

| Action | Rollback meaning |
|---|---|
| `UNIVERSAL_PEOPLE` OFF | Disable routes (404); **retain Airtable data** (**INV-18**) — includes Phase 2A semantics retained in durable store |
| `UNIVERSAL_PEOPLE_PERSIST` OFF | **Production:** illegal with People ON (INV-20). **Tests only:** memory adapter |
| Failed merge job | Status `failed` or `retryable`; absorbed **not** archived unless finalize completed; safe to retry |
| Failed import job | Completed rows stay; remaining rows retry; no PlatformRole side effects |
| Partial migration | Resume from checkpoint; no purge of created Persons |
| “Undo merge” | **Out of scope for 2B** |

Rollback never purges People tables automatically.

---

## 10. Concurrency, partial writes, retries, duplicate imports

### 10.1 Merge state machine (`People Merge Jobs`) — strengthened (INV-21)

Statuses: `queued` → `locking` → `copying` → `rewriting` → `finalizing` → `completed` | `failed` | `retryable`

Steps (idempotent by `(mergeJobId, stepName)`):

1. Validate same org + actor role + not already merged; bind job `organizationId` to session org.
2. **Locking:** optimistic lock both persons (`Updated At` / version match); set absorbed `Merge Job Id`.
3. **Copying:** Union directory memberships onto survivor; end absorbed membership (do **not** archive absorbed yet).
4. **Rewriting:** Rewrite/end relationships; upsert survivor edges with `Edge Key`; move/copy household members; upsert program links + consents; rewrite ACL grants.
5. Move external ids that do not conflict; on conflict, audit and keep survivor’s; update `OrgEmailKey` / `OrgExternalKey` sets.
6. **Finalizing (destructive boundary):** only after steps 3–5 succeed → set absorbed `mergedIntoPersonId`, `lifecycleStatus=archived` (tombstone), clear locks; append `people.merge` audit; mark job `completed`.

**Forbidden:** Archiving absorbed or setting `mergedIntoPersonId` before rewriting completes.

**Concurrent merges:** second job for same absorbed finds existing job or tombstone → return survivor id. Cross-org merge rejected.

**Crash:** Resume from last completed step; never skip to finalize.

### 10.2 Duplicate imports

- Create Import Job first (org from session slug only).
- Each row validate (PlatformRole elevation rejected — INV-8).
- Upsert person by `OrgEmailKey` / external id within org.
- Store row result; retrying job skips `ok` rows.
- Export uses shared redaction only (INV-14 / INV-25).

### 10.3 Partial fulfill / ensure

Fulfill continues to treat People ensure as non-fatal for commerce, but must:

- log **redacted** durable failure metric/audit when persist enabled, and
- be safe to retry (idempotent ensure), and
- never invent a memory Person when Persist ON and Airtable fails (INV-19).

### 10.4 Rate limits (bounded)

People Airtable adapter:

- Honor 429 / 5xx with exponential backoff + jitter.
- **Max attempts:** 5 per discrete operation (configurable ≤ 8).
- **Max backoff cap:** 30s.
- Exhaustion → classify **terminal** `failed_rate_limit` (or `retryable` for jobs with ops alert).
- Bulk migration: global throttle; no unbounded parallel creates.
- Emit metrics for 429 count (§20).

### 10.5 Retry classification

| Class | Examples | Handler behavior |
|---|---|---|
| **Safe to retry** | 429, 503, network timeout, OCC conflict (409 version) | Backoff and retry within bounds; re-read before write |
| **Unsafe without re-read** | Unknown 500 after create | Lookup by idempotency / `OrgEmailKey` before creating again |
| **Terminal** | 400 validation, PlatformRole elevation attempt, cross-org deny, schema reject, exhausted retries | Fail closed; do not loop; audit |

Out-of-order retries must use step idempotency keys; never assume “create again.”

### 10.6 Household / relationship concurrency + OCC (INV-23)

- Person PATCH requires `Updated At` (or version) match; mismatch → 409; client re-reads.
- Relationship / household member upserts use edge keys; concurrent ends+creates resolve to single active edge via upsert.
- Guardian access always re-evaluated at check time (INV-5/6); stored edges may lag — ACL is source of denial.

### 10.7 Tombstones / redirects (INV-22)

`GET /people/{id}` when person has `mergedIntoPersonId`:

- Resolve survivor in same org.
- If actor may view survivor → return survivor (or `308`-style JSON `{ redirectedTo }`).
- If not → `not_found` (do not leak existence across ACL).
- List endpoints exclude absorbed rows.

---

## 11. Feature flags and rollout

Keep **`UNIVERSAL_PEOPLE` default OFF**.

| Flag | Default | Meaning |
|---|---|---|
| `UNIVERSAL_PEOPLE` | **OFF** | Master: routes, ensure hooks, nav entitlement behavior (as 2A) |
| `UNIVERSAL_PEOPLE_PERSIST` | **OFF** | When ON with People ON → Airtable repository |
| `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS` | **OFF** | Enables batch Client Record backfill job |
| `UNIVERSAL_PEOPLE_READ_CLIENT_FALLBACK` | ON when People ON (optional) | Profile dual-read safety (2A intent) |
| `PEOPLE_MAJORITY_AGE` | `18` | Access-time majority |

**Illegal production/preview combo (INV-20):** `UNIVERSAL_PEOPLE=1` ∧ `UNIVERSAL_PEOPLE_PERSIST≠1` → People surfaces behave as OFF (404) or refuse boot. **No memory SoR.**

**Enablement prohibition (INV-26):** Do not set `UNIVERSAL_PEOPLE=1` in shared/production until Phase 2B persistence runtime certification passes uniqueness (ADV-P-1) and fail-closed (ADV-P-11/12).

### Rollout stages

| Stage | Flags | Gate |
|---|---|---|
| **S0** | All OFF | 2A behavior; durable writes only after Persist ON in later stages |
| **S1** | Persist ON in preview + People ON for synthetic org only | Persistence + restart + ADV-P-1 PASS |
| **S2** | People ON + Persist ON for internal EA org | ADV + ADV-P + migration dry-run |
| **S3** | Migrate flag ON for one pilot tenant | Backfill cert; no duplicate persons |
| **S4** | Broader tenants | Runtime cert PASS; §20 monitors green |
| **Rollback** | People OFF | Data retained; APIs 404 |

Never enable People persist in production with silent memory fallback.

---

## 12. Legal reacceptance shell (People reachability)

### 12.1 Finding (from Phase 2A runtime cert)

Authenticated `/portal/[slug]/people` is wrapped by portal layout:

- `app/portal/[slug]/layout.tsx` → `LegalReacceptanceShell` (`productId="portal_products"`)
- Gate UI: `LegalReacceptanceGate` / `evaluateReacceptanceGate`

**Effect:** Users with outstanding legal reacceptance never see the People shell; they see the trust gate instead. People **APIs** are not layout-wrapped and remain ACL-correct.

### 12.2 Phase 2B stance

| Option | Decision |
|---|---|
| Bypass legal gate for People | **Reject** — weakens Trust Center invariants |
| Treat as People defect | **Reject** — portal-wide, not People-specific |
| Document + certify | **Accept** — People UI reachable only after legal acceptance; API/cert harness continues to use authenticated API + smoke HTML for chrome |
| Ops checklist | Pilot tenants must have legal acceptances current before UX UAT |

Optional later (not 2B required): staff-only escape hatch in Trust Engine — only if Trust owners approve.

---

## 13. Testing and certification requirements

### 13.1 Automated suites (required)

| Suite | Purpose |
|---|---|
| Existing ADV-1…ADV-22 | Must pass on **memory** and **Airtable** adapters (Airtable via fixtures / test base) |
| **ADV-P-1…ADV-P-13** (§19) | Persistence adversarial matrix |
| Persistence contract tests | Same repository operations against both adapters |
| Restart tests | Write via Airtable → new process/instance → read same Person |
| Concurrency tests | Parallel ensure/create same identity → **exactly one** Person (**hard stop** on duplicates) |
| Merge job tests | Crash mid-job → retry → single survivor; no archive before finalize; no duplicate edges |
| Import idempotency | Re-run same job → no duplicate persons; PlatformRole still rejected |
| Migration tests | Client Record backfill dry-run + apply; checkpoint resume; no duplicates; Client Record intact |
| Rollback tests | Persist data → People flag OFF → API 404 → data still readable by admin script/repository |
| Fail-closed tests | Airtable down / Persist ON → 503; People ON Persist OFF in prod mode → 404 |
| Flag matrix | People OFF/ON × Persist OFF/ON (illegal prod combo) |
| Phase 1 pack contract | Still PASS; tasks empty; no Novu/RJSF |

### 13.2 Runtime certification (2B)

Must re-prove Phase 2A checklist **plus**:

- Multi-request durability across server restart
- Cross-instance read-after-write (two workers or sequential cold starts)
- Concurrent create/ensure uniqueness (ADV-P-1)
- Merge job completion under retry without destructive partial archive
- Fail-closed when Airtable unavailable
- No People rows written when flags OFF
- No memory SoR when Persist ON
- Legal gate condition still documented
- Synthetic fixtures only; no real PII; no production base pollution (dedicated test base)

Evidence path (proposed): `docs/audits/runtime-evidence-people-phase2b/`  
Report (proposed): `docs/reports/EA-UNIVERSAL-PORTAL-PHASE-2B-PEOPLE-PERSISTENCE-RUNTIME-CERTIFICATION.md`

**INV-26:** Shared/production `UNIVERSAL_PEOPLE=1` is **forbidden** until this cert passes ADV-P-1 and fail-closed controls.

---

## 14. Ordered implementation sequence and stop gates

| Step | Work | Stop gate (do not proceed if fail) |
|---|---|---|
| **0** | Phase 2A on `master` (`9239bf98…`) | Done |
| **1** | Extract `PeopleRepository` interface; Memory adapter wraps current store | All ADV-1…22 pass unchanged on memory |
| **2** | Airtable schema + `OrgEmailKey` / `OrgExternalKey` + job tables + verify script | Schema script PASS |
| **3** | Airtable adapter CRUD + upsert uniqueness | Contract tests; no silent empty on errors |
| **4** | Wire flags; INV-19/20 fail-closed | Illegal combo impossible; Airtable-down test PASS |
| **5** | Durable audit + redacted export/logs | INV-14/15/25 tests PASS |
| **6** | Merge Job with INV-21 finalize ordering + INV-22 tombstones; fix 2A merge gaps | ADV-P-4 PASS |
| **7** | Ensure/migrate durable; org-provision hook | ADV-14/15 + ADV-P-1/9 PASS |
| **8** | Import Job idempotency | Duplicate import tests PASS |
| **9** | OCC + household/relationship concurrency | ADV-P-2 PASS |
| **10** | Reconciliation script + §20 monitors | Dry-run recovery once |
| **11** | Preview runtime cert (restart + multi-instance + ADV-P) | Cert PASS; **ADV-P-1 hard stop** |
| **12** | Pilot tenant S3 backfill | Zero duplicate Persons; Client Records intact |
| **13** | Production enable decision | Explicit owner approval **after** INV-26 cert; People still default OFF in env templates |

**Hard stops:** OpenFGA install, Tasks/Novu/RJSF, second Airtable client, Postgres People SoR (unless ADV-P-1 fails → Phase 2C gate), memory fallback in production, enabling People before cert, shipping with known duplicate Persons.

---

## 15. Acceptance criteria — production readiness

Phase 2B is production-ready only when **all** are true:

1. `UNIVERSAL_PEOPLE` still defaults **OFF** in code and env examples.
2. With People ON + Persist ON, Person data survives process restart and is visible to all app instances.
3. ADV-1…ADV-22 and ADV-P-1…ADV-P-13 PASS against Airtable adapter (test base).
4. Concurrent ensure/create yields **exactly one** authoritative Person (ADV-P-1).
5. Cross-org isolation fail-closed under concurrent load.
6. Ensure/migrate/import/merge are idempotent under retries; merge never archives absorbed before finalize.
7. Imports cannot elevate PlatformRole; exports **and logs** use shared redaction.
8. Audit append-only and durable; no app update/delete.
9. OpenFGA remains non-authoritative stub; `acl.ts` does not import projector.
10. Fail-closed when Airtable unavailable; no production memory SoR (INV-19/20).
11. No Tasks/Novu/RJSF/industry portal runtime introduced.
12. Client Records never deleted by People paths.
13. Runtime certification report completed; rollback (flag OFF) retains data and 404s APIs.
14. Legal reacceptance behavior documented; UX UAT accounts are legally current.
15. Airtable schema documented and verifiable by script; reconciliation job exists.
16. §20 monitoring + alerts configured; traffic below scale reconsider threshold.
17. Architecture Gate + Integration Gate recorded: Airtable chosen with compensating controls; Postgres People SoR rejected for 2B unless uniqueness cert fails.

---

## 16. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Airtable non-transactional merges | High | Merge jobs + INV-21 finalize |
| Concurrent uniqueness races | Critical | Upsert keys + ADV-P-1 hard stop |
| Rate limits on backfill | High | §10.4 throttle; §20 alerts |
| Silent memory fallback in prod | Critical | INV-19/20 |
| Soft-fail empty vs error | Critical | INV-19 |
| Stale ACL cache | Critical | INV-27 |
| Schema drift / missing fields | Medium | verify script; INV-28 |
| Second Airtable client creep | Medium | platform-store only |
| Legal gate blocks UX UAT | Medium | Pre-clear acceptances; API cert separate |
| Premature Postgres SoR | High | Integration Gate reject unless cert forces 2C |
| Incomplete 2A merge semantics | High | Must complete in 2B before prod |

---

## 17. Explicit non-goals (repeat)

- Tasks module, Novu, RJSF
- Industry portal packs / People UX skins beyond minimal shell
- Full OpenFGA deployment
- Replacing Memberships or Client Records
- Connect lead bulk sync into People
- Unmerge / GDPR hard-delete product flows (design later under Trust)

---

## 18. Phase 2B security invariants (NEW — mandatory)

These **add** to Phase 2A INV-1…INV-18 (all still required).

| ID | Invariant |
|---|---|
| **INV-19** | When Persist ON, Airtable unavailable / exhausted retries → **fail closed** (5xx). Never return empty “success” that implies no Person. Never fall back to memory. |
| **INV-20** | Production/preview: People ON requires Persist ON. Illegal combo → People OFF behavior (404) or boot failure. **No memory SoR.** |
| **INV-21** | Merge must not archive absorbed or set `mergedIntoPersonId` until copy/rewrite steps succeed (finalize boundary). |
| **INV-22** | Merged persons remain as tombstones; GET by absorbed id redirects to survivor under ACL (or not_found). |
| **INV-23** | Person (and critical edge) updates use optimistic concurrency; conflicts return 409. |
| **INV-24** | Audit is append-only in app; ops restricts Airtable UI mutation of audit rows. |
| **INV-25** | Exports **and** logs/metrics use shared field redaction (no raw DOB dumps). |
| **INV-26** | Do not enable `UNIVERSAL_PEOPLE` in shared/production until Phase 2B persistence runtime certification passes ADV-P-1 and fail-closed tests. |
| **INV-27** | `assertPeopleAccess` must not consume cross-request caches for person/relationship/consent/ACL rows. |
| **INV-28** | Malformed stored JSON / unexpected shapes are rejected or fail closed on read/write — never trusted blindly. |

---

## 19. Persistence adversarial test matrix (NEW — ADV-P)

| ID | Attack / failure | Expected |
|---|---|---|
| **ADV-P-1** | Two parallel ensure/create for same Client Record / email | Exactly one authoritative Person |
| **ADV-P-1b** | Two staff concurrent create same email | One Person or one 409→same id |
| **ADV-P-2** | Concurrent household member + relationship edits | No duplicate active edges; OCC/upsert holds |
| **ADV-P-3** | Re-run same import job | No duplicate Persons; row results stable |
| **ADV-P-4** | Kill worker mid-merge; retry; out-of-order step retry | Survivor single; absorbed archived only after finalize; no edge dup storm |
| **ADV-P-5** | Inject 429 storm | Bounded retries; terminal/retryable job; no unbounded loop |
| **ADV-P-6** | Expiry/majority change with warm cache attempt | ACL denies immediately (no stale allow) |
| **ADV-P-7** | Malformed Emails JSON in Airtable | Reject/fail closed; no crash leak |
| **ADV-P-8** | Merge/import job with foreign organizationId in body | Ignored; session org only; cross-org deny |
| **ADV-P-9** | Backfill crash + resume from checkpoint | No duplicate Persons; Client Record intact |
| **ADV-P-10** | Export + forced error log path | DOB absent for unauthorized; logs redacted |
| **ADV-P-11** | People ON + Persist OFF in production mode | 404 / refuse; no memory writes |
| **ADV-P-12** | Airtable down with Persist ON | 503 fail closed; no empty directory success |
| **ADV-P-13** | GET absorbed person id after merge | Redirect to survivor under ACL or not_found |

All ADV-P tests mandatory before INV-26 enablement.

---

## 20. Operational recovery, monitoring, and scale gate (NEW)

### 20.1 Failed job recovery runbook

1. Identify job in `People Merge Jobs` / `People Import Jobs` with `failed` or stuck `retryable` older than threshold.  
2. Inspect redacted audit + step status (do not dump PII to chat/tickets).  
3. If `retryable` → re-queue from last completed step (idempotent).  
4. If uniqueness conflict (duplicate `OrgEmailKey`) → **stop automation**; ops merge via controlled Merge Job; page on-call.  
5. If orphan edges → run reconciliation (§6.6); quarantine orphans; do not hard-delete Persons.  
6. Record incident note; confirm ADV-P-4 style retry in staging if novel failure.

### 20.2 Monitoring and alert thresholds (initial)

| Signal | Warn | Page |
|---|---|---|
| Airtable 429 rate (People adapter) | > 5/min for 10 min | > 30/min for 5 min |
| Merge jobs `failed` | ≥ 1/hour | ≥ 3/hour or any finalize invariant break |
| Import jobs `failed_rate_limit` | ≥ 1 | Sustained |
| Duplicate `OrgEmailKey` detected | any | any |
| People 5xx ratio | > 1% / 5 min | > 5% / 5 min |
| Reconciliation orphan count | > 0 | > 10 or growth |

### 20.3 Volume / scale threshold — reconsider Airtable

Trigger **Phase 2C datastore reconsideration** (Integration Gate) if **any** sustained for 7 days on a production tenant or platform-wide:

- People write QPS (create/update/merge steps) **> 3 sustained** against the shared base after throttling, **or**
- People-related **429s > 1%** of People Airtable calls, **or**
- Single org active Persons **> 25,000** with directory list latency **p95 > 2s**, **or**
- ADV-P-1 cannot pass under certified concurrency load.

Until then Airtable + compensating controls remain the Phase 2B SoR.

---

## Final summary

### Recommended authoritative datastore

**Airtable (EA payments base), via existing `airtable-client` / `platform-store` — not a new database — with mandatory compensating controls (§2.4, §18).**

### Why it fits EA

Matches Prompt #000 and chassis storage doctrine; keeps Person adjacent to Organizations, Client Records, Memberships, and fulfill; avoids a second OLTP for portal identity; reuses known ops/backup; implements Phase 2A §17.4 with concurrency realism **after** security revision.

### Major risks

Non-transactional merges, uniqueness races (P0), rate limits, soft-fail empty reads, stale ACL caches, and any production memory fallback.

### Required migrations

Additive Airtable People* (+ Merge/Import job) tables with `OrgEmailKey` / `OrgExternalKey`; Client Record → Person backfill job (flagged); no Client Record deletion; repository extraction from in-memory store.

### Required tests

ADV-1…22 + ADV-P-1…13 on both adapters; persistence contract; restart; concurrency hard stop; merge/import idempotency; migration; rollback; fail-closed; Phase 1 regression; Phase 2B runtime certification.

### Whether Phase 2B is ready for implementation

**YES — ready for an explicit implementation prompt**, after this security-revised blueprint is accepted and **APPROVED WITH CONDITIONS** checklist (§security review §8) is acknowledged.

**Not ready to enable in production** until implementation + persistence runtime certification pass **including ADV-P-1** (INV-26).

---

## Security review verdict (incorporated)

**APPROVED WITH CONDITIONS** — see [EA-UNIVERSAL-PORTAL-PHASE-2B-PEOPLE-PERSISTENCE-SECURITY-REVIEW.md](../reviews/EA-UNIVERSAL-PORTAL-PHASE-2B-PEOPLE-PERSISTENCE-SECURITY-REVIEW.md).

---

*End of Phase 2B blueprint (security-revised). Do not implement from this document without a separate implementation instruction.*
