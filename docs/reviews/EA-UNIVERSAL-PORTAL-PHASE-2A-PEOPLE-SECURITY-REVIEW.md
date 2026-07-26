# EA Universal Portal — Phase 2A People Security Review

**Document type:** Adversarial architecture & security review (docs only)  
**Subject:** [EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-BLUEPRINT.md](../plans/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-BLUEPRINT.md)  
**Review date:** 2026-07-26  
**Branch / SHA:** `master` @ `c1bbc78260ef7cede436146741c5af1e4a874d6d`  
**Scope:** Blueprint review only — **no product code implemented**  
**Out of scope:** Tasks Inbox, Novu, RJSF, industry portals, OpenFGA deploy  

---

## Verdict

**APPROVED WITH CONDITIONS**

All **P0** and **P1** findings from this review are resolved in the revised blueprint (security invariants §25, adversarial matrix §26, and targeted control corrections). Implementation may proceed only when the conditions in §Verdict conditions are met. **Do not begin implementation from this chat.**

---

## 1. Method

1. Read Phase 2A People blueprint end-to-end.  
2. Cross-check against Phase 1 evidence (`lib/portal-universal/*`, orgs, memberships, Client Records, RBAC, portal guards, fulfill).  
3. Attack each listed failure scenario.  
4. Classify severity (P0–P3).  
5. Revise blueprint for every P0/P1.  
6. Re-score scenarios after revision.

Severity guide:

| Sev | Meaning |
|---|---|
| **P0** | Cross-tenant leak, privilege escalation, or silent SoR corruption if implemented as originally written |
| **P1** | High likelihood of wrong access / data loss / dual-Person under real ops |
| **P2** | Defense-in-depth / clarity gap |
| **P3** | Documentation polish |

---

## 2. Conflict check vs existing platform

| Existing surface | Conflict risk (pre-fix) | Post-revision posture |
|---|---|---|
| **Organizations** | Low — Person requires `organizationId` | **No conflict.** `organizationId` immutable; always resolved from session slug→org. |
| **Client Records** | Medium — dual SoR; migration could duplicate or drop CTP links | **No replacement.** Commerce SoR stays Client Record; Person attaches via external id; migration preserves program links. |
| **Portal sessions** | **P0** — `assertPeopleAccess` trusted caller-supplied `organizationId` | **Fixed.** Org id from `session.slug` → `findOrganizationByPortalSlug` only; body org id ignored. |
| **Membership / RBAC** | Medium — `PersonOrgMembership` naming collision; volunteer→staff confusion | **Orthogonal.** Directory roles never create/alter `Membership` / `PlatformRole`. |
| **Entitlements** | Low — new `people` module | Flag OFF ⇒ routes 404 even if module id exists; no package entitlement sync when OFF. |
| **CTP / fulfill** | **P1** — second Person on retry | **Fixed.** Single `ensurePersonForClientRecord` upsert key. |
| **Connect** | Low — optional link only | Unchanged; no wholesale migrate. |
| **Phase 1 packs** | Low — `people` nav `never` | Unchanged until deliberate enable. |

---

## 3. Scenario matrix (post-revision)

Legend: **Prevents?** = after blueprint revision.

| # | Scenario | Prevents? | Control responsible | Missing/ambiguous (original) | Blueprint correction | Required test | Sev |
|---|---|---|---|---|---|---|---|
| 1 | Person attached to wrong organization | **Yes** | Immutable `organizationId`; tenant resolve from session slug; store rejects mismatched writes | Body could supply org id; portalSlug optional/unverified | INV-1, INV-2, §3.2, §10.3, §12.3 | S1, S2, S6, ADV-1 | **P0** |
| 2 | Same email in multiple organizations | **Yes (by design)** | Per-org Person rows; email uniqueness **within** org only | Could be misread as global unique | Clarify §3.2; INV-3 | ADV-2 | P2→ok |
| 3 | One person different roles across orgs | **Yes** | Separate Person + `PersonDirectoryRole` per org | Naming collision with `Membership` | Rename to `PersonDirectoryMembership`; INV-4 | ADV-3 | P2→ok |
| 4 | Parent accessing unrelated child | **Yes** | Guardian only via **subject-specific** `guardian_of` / `authorized_rep_for` edge (or household edge **to that child**) + consent + non-expired ACL | Household `isAuthorizedRepresentative` implied blanket access to all minors | §3.5 rewrite; no household-wide guardian | S4, ADV-4 | **P0** |
| 5 | Expired guardian authorization | **Yes** | Check-time expiry on consent, relationship, ACL grant, household auth window | Expiry fields existed; evaluation order omitted checks | §10.3 step 0 expiry; INV-5 | ADV-5 | **P0** |
| 6 | Minor becoming an adult | **Yes** | Check-time majority (`PEOPLE_MAJORITY_AGE`); derived guardian access ends; optional audit | No aging rule | §4 majority transition; INV-6 | ADV-6 | **P1** |
| 7 | Former employee retaining access | **Yes** | Login = `Membership` only; directory roles ≠ PlatformRole; ended directory membership denies directory editor; staff offboarding checklist | No sync policy Membership↔Person | §3.3 offboarding; INV-7 | ADV-7 | **P1** |
| 8 | Volunteer receiving staff permissions | **Yes** | Directory roles never elevate `PlatformRole`; import allowlist; `org_leader`/`staff_contact` are directory-only | Import could assign `org_leader` freely; unclear elevation | §7 import caps; INV-4, INV-8 | ADV-8 | **P0** |
| 9 | Deleted/archived person still accessible | **Yes** | Lifecycle gate in ACL: archived/deceased/merged deny for non-`owner|admin`; member dir excludes; prefer 404 | Staff short-circuit too broad | §5 + §10.3 lifecycle gate; INV-9 | S10, ADV-9 | **P1** |
| 10 | Deceased exposing or destroying records | **Yes** | No cascade delete; retain links/audit; marketing denied; export owner-only for deceased PII | Cascade unspecified; hard delete vs retain ambiguous | §5, §9 deceased rules; INV-10 | ADV-10 | **P1** |
| 11 | Duplicate merge crossing orgs | **Yes** | Merge asserts identical `organizationId` **and** session org | Session org not in algorithm | §6.2; INV-1 | S3, ADV-11 | **P0** |
| 12 | Malicious import elevated roles | **Yes** | Import cannot write Membership/PlatformRole; role allowlist by actor PlatformRole; dry-run | Only “valid role codes” | §7 hardened; INV-8 | ADV-8, ADV-12 | **P0** |
| 13 | Client Record migration losing relationships | **Yes** | Migration attaches `PersonProgramLink` for known CTP/workspace refs; never deletes Client/CTP | Only mapped name/email/slug | §14.2 preservation; INV-11 | ADV-13 | **P1** |
| 14 | Partial migration / retry duplicates | **Yes** | Unique `(organizationId, external.system, external.value)`; upsert by client-record id then email | Idempotent claimed, no unique key | §3.2 external id uniqueness; §14 | ADV-14 | **P1** |
| 15 | CTP provisioning creating second Person | **Yes** | Single `ensurePersonForClientRecord` used by fulfill, org-provision, CTP bind | Multiple hooks could diverge | §13 single upsert; INV-12 | ADV-15 | **P1** |
| 16 | Session slug ≠ record organization | **Yes** | Resolve org from slug; compare person.organizationId; ignore body org | assertPeopleAccess took free organizationId | §10.3, §12.3; INV-1 | ADV-16 | **P0** |
| 17 | Direct API bypassing portal navigation | **Yes** | Every route: flag gate → `guardPortalApi` → slug match → `requirePortalModule('people')` → ACL | Implied but not mandatory checklist | §17 route invariants; INV-13 | ADV-17 | **P0** |
| 18 | Field restrictions bypassed via exports | **Yes** | Export uses `redactPersonForActor` only; no raw store export; export job ACL | “staff+ redaction” underspecified | §7 export pipeline; INV-14 | S5, S9, ADV-18 | **P0** |
| 19 | Audit records altered or deleted | **Yes** | Store exposes `appendAudit` only; no update/delete API; reject mutations | “Append-only” without enforcement | §8 immutable audit; INV-15 | ADV-19 | **P1** |
| 20 | OpenFGA projector becomes authoritative | **Yes** | `assertPeopleAccess` must not import `AuthzProjector`; projector is export-only; contract test | Stub could be wired into check | §11; INV-16 | ADV-20 | **P1** |
| 21 | `UNIVERSAL_PEOPLE` OFF changes existing behavior | **Yes** | Flag OFF: people routes 404; fulfill hook no-op; no entitlement auto-add; packs people.enabled ignored | Module registration side effects unclear | §16; INV-17 | ADV-21 | **P0** |
| 22 | Rollback after relationship data written | **Yes** | Flag OFF retains data; no purge; APIs 404; re-enable resumes | Purge temptation undocumented | §14.3, §16; INV-18 | ADV-22 | **P1** |

---

## 4. Finding detail (P0 / P1 only)

### P0-1 — Trusted caller `organizationId` (scenarios 1, 16, 17)
**Original:** `assertPeopleAccess({ organizationId })` from caller.  
**Risk:** Forged body org or mismatched slug→org.  
**Fix:** Resolve tenant exclusively from authenticated `session.slug`.

### P0-2 — Household-wide guardian (scenario 4)
**Original:** `isAuthorizedRepresentative` on household membership without requiring edge to specific child.  
**Risk:** Parent in household reads unrelated child.  
**Fix:** Subject-specific relationship or household membership pair (guardian + that child) required.

### P0-3 — Missing expiry evaluation (scenario 5)
**Original:** `expiresAt` on consent/ACL unused in evaluation order.  
**Fix:** Step-0 reject expired grants/consents/relationships.

### P0-4 — Import / directory role privilege escalation (scenarios 8, 12)
**Original:** Any valid `UniversalPersonRoleCode` importable.  
**Risk:** Volunteer CSV → `org_leader`; confusion with staff PlatformRole.  
**Fix:** Directory roles never touch Membership; import allowlist by actor rank.

### P0-5 — Export bypasses field ACL (scenario 18)
**Original:** Vague “field-ACL redaction”.  
**Fix:** Mandatory shared redaction function for GET and export.

### P0-6 — Merge missing session org bind (scenario 11)
**Fix:** Merge requires session org == both person orgs.

### P0-7 — Flag OFF behavior bleed (scenario 21)
**Fix:** Hard 404 + no fulfill side effects + no entitlement sync when OFF.

### P1-1 — Majority aging (scenario 6)
**Fix:** Check-time majority ends derived guardian access.

### P1-2 — Former employee (scenario 7)
**Fix:** Document offboarding: suspend Membership to kill login; end directory membership for directory rights.

### P1-3 — Archived/deceased visibility (scenarios 9–10)
**Fix:** Lifecycle gate; no cascade destroy; retain audit/links.

### P1-4 — Migration / provisioning duplicates & lost links (scenarios 13–15)
**Fix:** Unique external ids; single ensurePerson; preserve program links.

### P1-5 — Audit mutability & OpenFGA authority (scenarios 19–20)
**Fix:** Append-only store API; projector forbidden in ACL path.

### P1-6 — Rollback data retention (scenario 22)
**Fix:** Explicit no-purge on flag OFF.

---

## 5. P2 / P3 (not blocking; tracked)

| ID | Note | Sev |
|---|---|---|
| P2-1 | Optional hash-chained audit for tamper evidence | P2 |
| P2-2 | Cron to mark consents expired (check-time already safe) | P2 |
| P2-3 | Rename UI copy “membership” vs portal Membership to reduce operator confusion | P2 |
| P3-1 | Majority age per-jurisdiction packs (keep global default 18 in 2A) | P3 |

---

## 6. Blueprint revisions applied

The following were written into the People blueprint:

1. **§3.2** — Immutable org; unique external ids; portalSlug verification.  
2. **§3.3** — Renamed clarity `PersonDirectoryMembership`; offboarding; no PlatformRole elevation.  
3. **§3.5 / §4** — Subject-specific guardian; expiry; majority aging.  
4. **§5 / §9** — Lifecycle access; deceased retention / no cascade.  
5. **§6.2** — Session org on merge.  
6. **§7** — Import allowlist; export redaction pipeline.  
7. **§8** — Immutable audit store API.  
8. **§10.3** — Tenant resolve, expiry, lifecycle gates.  
9. **§11** — Projector non-authoritative + test guard.  
10. **§13 / §14 / §16** — Single ensurePerson; migration preservation; flag OFF hard gate; rollback no-purge.  
11. **NEW §25 Security invariants**  
12. **NEW §26 Mandatory adversarial test matrix**  

---

## 7. Verdict conditions

**APPROVED WITH CONDITIONS** — implementation may start only if:

1. Implementers treat **§25 Security invariants** as non-negotiable acceptance criteria.  
2. **§26** adversarial tests are automated before any `UNIVERSAL_PEOPLE=1` in shared environments.  
3. Feature flag remains **default OFF** in production until a separate runtime certification (mirror Phase 1 cert).  
4. Scope creep into Tasks / Novu / RJSF / industry portals remains rejected.  
5. OpenFGA packages are not added to `package.json` in Phase 2A.

---

## Verdict (repeat)

**APPROVED WITH CONDITIONS**
