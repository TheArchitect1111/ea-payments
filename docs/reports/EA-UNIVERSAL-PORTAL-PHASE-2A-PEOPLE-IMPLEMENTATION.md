# EA Universal Portal — Phase 2A People Implementation Report

**Status:** Implemented (not committed / not pushed / not deployed)  
**Blueprint:** [docs/plans/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-BLUEPRINT.md](../plans/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-BLUEPRINT.md)  
**Security review:** [docs/reviews/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-SECURITY-REVIEW.md](../reviews/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-SECURITY-REVIEW.md)  
**Branch:** `master`  
**Base SHA:** `c1bbc78260ef7cede436146741c5af1e4a874d6d`  
**Report date:** 2026-07-26  

---

## Verdict

**READY FOR RUNTIME CERTIFICATION**

All Phase 2A foundation code, §25 invariants, and ADV-1…ADV-22 automated tests are in place with `UNIVERSAL_PEOPLE` default OFF. No commit/push/deploy performed.

---

## 1. Files created

| Path | Purpose |
|---|---|
| `lib/people/types.ts` | Person, directory roles, household, relationships, consent, ACL, audit |
| `lib/people/flags.ts` | `isUniversalPeopleEnabled` (`UNIVERSAL_PEOPLE`) |
| `lib/people/minor.ts` | Majority / expiry helpers (INV-5, INV-6) |
| `lib/people/store.ts` | In-memory store; append-only audit; immutable org |
| `lib/people/acl.ts` | `assertPeopleAccess`, `redactPersonForActor` (no projector import) |
| `lib/people/authz-port.ts` | Non-authoritative `AuthzProjector` stub |
| `lib/people/ensure-person.ts` | Idempotent `ensurePersonForClientRecord` (INV-12) |
| `lib/people/migrate-from-client.ts` | Client Record → Person + program links |
| `lib/people/import-export.ts` | Import allowlist; PlatformRole rejection (INV-8) |
| `lib/people/merge.ts` | Same-org merge only (INV-1) |
| `lib/people/resolve-tenant.ts` | Org from slug; ignore body org id (INV-1) |
| `lib/people/guard.ts` | INV-13 route checklist; flag OFF → 404 |
| `lib/people/index.ts` | Public exports |
| `app/api/portal/[slug]/people/route.ts` | List / create |
| `app/api/portal/[slug]/people/[personId]/route.ts` | Get / patch |
| `app/api/portal/[slug]/people/export/route.ts` | CSV via shared redaction (INV-14) |
| `app/api/portal/[slug]/people/import/route.ts` | Import with role caps |
| `app/api/portal/[slug]/people/merge/route.ts` | Merge |
| `app/portal/[slug]/people/page.tsx` | Minimal directory; `notFound()` when flag OFF |
| `scripts/test-people-adversarial.mts` | ADV-1…ADV-22 |
| `scripts/test-people-provisioning-regression.mts` | Flag OFF fulfill no-op |
| `docs/reports/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-IMPLEMENTATION.md` | This report |

---

## 2. Files modified

| Path | Change |
|---|---|
| `lib/modules/registry.ts` | ModuleId `people`; ea-client preset includes `people` |
| `lib/portal-universal/capability-ids.ts` | `UNIVERSAL_TO_MODULES.people = ['people']` |
| `lib/experience-registry.ts` | Capability `people-directory` |
| `lib/chassis/portal-nav-mapping.ts` | Icon mapping for `people` |
| `lib/fulfill-paid-client.ts` | Flag-gated dynamic `ensurePersonForClientRecord` |
| `.env.example` | `UNIVERSAL_PEOPLE=` (default empty/OFF) |
| `scripts/test-industry-pack-unit.mts` | Expect people → `['people']` |
| `scripts/test-industry-pack-runtime-cert.mts` | People mapped; tasks still empty; extensions still off |
| `scripts/runtime-cert-universal-portal-phase1.mts` | Same map expectation |

**Not implemented (by design):** Tasks, Novu, RJSF, OpenFGA package, industry portals, Airtable People tables (in-memory store for 2A foundation; durable table wiring can follow runtime cert).

---

## 3. Security invariants (§25)

| ID | Enforcement |
|---|---|
| INV-1 | `resolvePeopleTenantFromSlug` + `ignoreBodyOrganizationId`; ACL org match |
| INV-2 | `updatePerson` rejects `organizationId` changes |
| INV-3 | Email uniqueness per org only |
| INV-4 | Directory roles never write Membership/PlatformRole |
| INV-5 | Expiry checked in ACL / guardian edges / consents |
| INV-6 | `isPersonMinorAt` at check time |
| INV-7 | Ended directory membership orthogonal to Membership login |
| INV-8 | `validateImportRow` allowlist + PlatformRole rejection |
| INV-9 | Archived/deceased → `not_found` for non-admin |
| INV-10 | Deceased does not cascade-delete relationships |
| INV-11 | External id uniqueness; migration creates program links |
| INV-12 | Single `ensurePersonForClientRecord` upsert |
| INV-13 | `guardPeopleApi` checklist |
| INV-14 | Export uses `personToExportRow` → `redactPersonForActor` |
| INV-15 | `appendPeopleAudit` only; update/delete throw |
| INV-16 | `acl.ts` has no projector import; no OpenFGA dep |
| INV-17 | Flag default OFF; routes 404; ensure no-op |
| INV-18 | Store retained when flag OFF (ADV-22) |

---

## 4. Feature flag

| `UNIVERSAL_PEOPLE` | Behavior |
|---|---|
| unset / `0` / false | **Default.** API/page 404; fulfill People hook no-op; CX/CTP unchanged |
| `1` / `true` / `on` / `yes` | People APIs + ensurePerson active |

Independent of `UNIVERSAL_NAV_PACKS`.

---

## 5. Verification results

| Check | Result |
|---|---|
| `npx tsx scripts/test-people-adversarial.mts` | **PASS** 22/22 |
| `npx tsx scripts/test-people-provisioning-regression.mts` | **PASS** |
| `node scripts/test-industry-pack-contract.mjs` | **PASS** |
| `npx tsx scripts/test-industry-pack-unit.mts` | **PASS** |
| `npx tsx scripts/test-industry-pack-runtime-cert.mts` | **PASS** 17/17 |
| `npx eslint lib/people --max-warnings 0` | **PASS** (after unused-var fixes) |
| Full-repo `tsc` | Pre-existing errors remain (e.g. `.next/dev/types/routes.d.ts`); **not Phase 2A blockers** |

---

## 6. Backward compatibility

- Client Experience five-nav unchanged when People flag OFF (ADV-21).  
- Fulfill only calls People when flag ON; dynamic import; failures non-fatal.  
- Phase 1 packs keep `extensions.people.enabled: false` and nav `visibility: never`.  
- Unrelated working-tree WIP left untouched outside Phase 2A files listed above.

---

## 7. Runtime certification next steps (not done here)

1. Enable `UNIVERSAL_PEOPLE=1` on local/demo only.  
2. Authenticated staff session against `demo-client` / `ea`.  
3. Exercise list/create/export/import/merge + guardian fixtures.  
4. Confirm flag OFF restores 404 with data retained.  
5. Write `docs/reports/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-RUNTIME-CERTIFICATION.md`.

---

## Verdict (repeat)

**READY FOR RUNTIME CERTIFICATION**
