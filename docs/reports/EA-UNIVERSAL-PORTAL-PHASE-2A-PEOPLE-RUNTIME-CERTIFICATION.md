# EA Universal Portal — Phase 2A People Runtime Certification

**Status:** Certified (not committed / not pushed / not deployed)  
**Blueprint:** [docs/plans/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-BLUEPRINT.md](../plans/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-BLUEPRINT.md)  
**Security review:** [docs/reviews/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-SECURITY-REVIEW.md](../reviews/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-SECURITY-REVIEW.md)  
**Implementation:** [docs/reports/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-IMPLEMENTATION.md](./EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-IMPLEMENTATION.md)  
**Certification date:** 2026-07-26  
**Scope:** Phase 2A People only. No Tasks / Novu / RJSF / industry-portal runtime / OpenFGA install. Synthetic local fixtures only — no production Airtable People writes, no real PII.

---

## Verdict

**PASS WITH CONDITIONS**

All ADV-1…ADV-22 checks passed (22/22). In-process runtime harness passed (25/25). Live HTTP probes passed for flag OFF (hard API 404 + authenticated page without People shell) and flag ON (role ACL, body `organizationId` ignored, cross-slug deny). One Phase 2A defect was found and fixed during certification (GET on merge/import returned bare 405 when flag OFF). Remaining conditions are platform ordering / Trust gate — not People ACL failures.

Do not commit, push, or deploy until explicitly requested. Keep `UNIVERSAL_PEOPLE` default **OFF**.

---

## 1. Method

| Item | Detail |
|---|---|
| Adversarial | `npx tsx scripts/test-people-adversarial.mts` → ADV-1…ADV-22 |
| Provisioning | `npx tsx scripts/test-people-provisioning-regression.mts` |
| Phase 1 regression | `npx tsx scripts/test-industry-pack-contract.mjs` |
| In-process cert | `npx tsx scripts/runtime-cert-people-phase2a.mts` |
| HTTP auth ON | `npx tsx scripts/runtime-cert-people-http-auth.mts` (`UNIVERSAL_PEOPLE=1` server) |
| HTTP auth OFF | `npx tsx scripts/runtime-cert-people-http-flag-off.mts` (`UNIVERSAL_PEOPLE=0` server) |
| Runtime | Local Next.js `http://127.0.0.1:3010` + in-process TS |
| Fixtures | Synthetic emails `@example.test`; orgs `cert_org_alpha` / `cert_org_beta`; slugs `demo-client` / `other-org-demo` |
| Evidence root | `docs/audits/runtime-evidence-people-phase2a/` |

Flag states:

| State | How set | Expected |
|---|---|---|
| OFF | unset or `UNIVERSAL_PEOPLE=0` | People APIs/page hard-404 / no People shell; fulfill/CX unchanged |
| ON | `UNIVERSAL_PEOPLE=1` | People APIs + page for authorized roles; tenant from session slug only |

Roles exercised: `guest`, `staff`, `owner`, `parent_guardian` (in-process), synthetic HMAC portal session (HTTP).

---

## 2. Routes and APIs tested

| Route / API | Flag | Auth | HTTP result |
|---|---|---|---|
| `/portal/demo-client/people` | OFF | none | **307** → `/portal/login` |
| `/portal/demo-client/people` | OFF | owner | **200** Next not-found / no People shell (`isPeopleShell=false`) |
| `/api/portal/demo-client/people` GET/POST | OFF | none / owner | **404** `{"ok":false,"error":"Not found"}` |
| `/api/portal/.../people/merge` GET | OFF | owner | **404** (after fix; was 405) |
| `/api/portal/.../people/import` GET | OFF | owner | **404** (after fix; was 405) |
| `/api/portal/.../people/export` GET | OFF | owner | **404** |
| `/api/portal/.../people/[id]` GET | OFF | none | **404** |
| `/portal/demo-client/ctp/progress` | OFF | owner | **200** (unchanged; not People 404) |
| `/portal/login` | ON/OFF | none | **200** |
| `/api/portal/demo-client/people` GET | ON | none | **401** |
| `/api/portal/demo-client/people` GET | ON | guest | **403** |
| `/api/portal/demo-client/people` GET | ON | staff | **200** people list |
| `/api/portal/demo-client/people` POST | ON | staff + body `organizationId=evil…` | **200**; `portalSlug=demo-client`; body org ignored |
| `/api/portal/demo-client/people` GET | ON | owner cookie for `other-org-demo` | **403** Portal access denied |
| `/portal/demo-client/people` | ON | staff | **200** (Legal reacceptance shell in front of People; not hard 404) |
| merge / import / export / person | ON | none | **401** |

Evidence: `http-probes.json`, `http-flag-off-auth-probes.json`, `http-auth-probes.json`.

---

## 3. Certification matrix (runtime harness + HTTP)

Source: `docs/audits/runtime-evidence-people-phase2a/cert-summary.json` (25/25) plus HTTP auth suites.

| ID | Routes / surface | Roles | Orgs / slugs | Flag | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|---|
| FLAG-OFF-ENABLED | `UNIVERSAL_PEOPLE` | N/A | N/A | OFF | disabled | `enabled=false` | **PASS** |
| FLAG-OFF-ENSURE-NOOP | `ensurePersonForClientRecord` | system | cert_org_alpha | OFF | no write | noop | **PASS** |
| FLAG-OFF-ACL-404 | `assertPeopleAccess` | owner | cert_org_alpha | OFF | `not_found` | `not_found` | **PASS** |
| FLAG-OFF-CX-UNCHANGED | `/portal/demo-client/ctp/*` | client | demo-client | OFF | five CX destinations | progress…journey | **PASS** |
| FLAG-OFF-PHASE1-MAP | `UNIVERSAL_TO_MODULES` | N/A | N/A | N/A | people→people; tasks empty | people=people | **PASS** |
| FLAG-ON-ENABLED | flag | N/A | N/A | ON | enabled | true | **PASS** |
| TENANT-FROM-SLUG | `resolvePeopleTenantFromSlug` | N/A | demo-client→cert_org_alpha | ON | org from slug only | cert_org_alpha | **PASS** |
| BODY-ORG-IGNORED | POST people | staff | cert_org_alpha | ON | body org stripped | stays session org | **PASS** |
| CROSS-ORG-READ-WRITE-MERGE | ACL + merge | owner | alpha vs beta | ON | fail | readFail+mergeFail | **PASS** |
| SAME-EMAIL-MULTI-ORG | createPerson | staff | alpha+beta | ON | two persons | two ids | **PASS** |
| DUP-EMAIL-WITHIN-ORG | createPerson | staff | alpha | ON | reject | rejected | **PASS** |
| GUARDIAN-SUBJECT-SPECIFIC | ACL | guest+guardian | alpha | ON | X only | x=true;y=false | **PASS** |
| GUARDIAN-EXPIRED | ACL | guest | alpha | ON | deny | denied | **PASS** |
| MAJORITY-AT-ACCESS | ACL | guest | alpha | ON | adult DOB ends guardian | denied | **PASS** |
| ARCHIVED-RESTRICT | GET person | staff vs owner | alpha | ON | staff not_found | staff=false;owner=true | **PASS** |
| IMPORT-NO-PLATFORM-ROLE | import validate | staff/owner | alpha | ON | no PlatformRole elevate | caps ok | **PASS** |
| EXPORT-REDACTION | export row | staff viewer | alpha | ON | DOB absent | dob redacted | **PASS** |
| MIGRATION-IDEMPOTENT | migrate | system | alpha | ON | stable id | same person | **PASS** |
| PROVISION-IDEMPOTENT | ensure | system | alpha | ON | retries same id | same id | **PASS** |
| AUDIT-ON-MUTATION | audit log | staff | alpha | ON | create events | audit≥1 | **PASS** |
| OPENFGA-NON-AUTH | acl vs authz-port | N/A | N/A | N/A | projector stub only | stub; no acl import | **PASS** |
| NO-TASKS-NOVU-RJSF | `lib/people` | N/A | N/A | N/A | clean | clean | **PASS** |
| ROLLBACK-RETAIN | flag OFF after write | owner | alpha | OFF | data kept; ACL deny | retained+denied | **PASS** |
| HTTP-FLAG-OFF-ROUTES | page+API | unauth | demo-client | OFF | never 200 People payload | page=307; api=404 | **PASS** |
| HTTP-FLAG-ON-ROUTES | page+API | unauth | demo-client | ON* | not 500 | see §Conditions | **PASS** |
| HTTP-AUTH-* (6) | people APIs + page | guest/staff/cross-slug | demo-client | ON | ACL + body org ignore | 6/6 | **PASS** |
| HTTP-FLAG-OFF-AUTH (7) | people APIs + page + CTP | owner | demo-client | OFF | API 404; no People shell | 7/7 | **PASS** |
| ADV-1…ADV-22 | §26 suite | mixed | alpha/beta | ON/OFF | all adversarial cases | **22/22** | **PASS** |

\* Main harness HTTP “ON” labels flip `process.env` in-process only; live Next env was certified separately via `http-auth-probes.json` with server `UNIVERSAL_PEOPLE=1`.

---

## 4. Requirement checklist (user brief)

| Requirement | Result |
|---|---|
| Flag OFF hard 404 for all new People routes | **PASS** for APIs (GET/POST). Page: unauth **307** then auth **not-found** (no People shell). Merge/import GET fixed to 404. |
| Flag OFF leaves portal/fulfillment unchanged | **PASS** (ADV-21, CX nav, CTP progress reachable, ensure noop) |
| Flag ON exposes People only to authorized roles | **PASS** (guest 403 list; staff 200; ACL suite) |
| Tenant org from authenticated session slug only | **PASS** |
| Request-body organization IDs cannot change tenant | **PASS** (in-process + live HTTP POST) |
| Direct API cannot bypass ACL | **PASS** (401 unauth; 403 wrong slug/role; flag OFF 404) |
| Cross-org read/write/search/export/merge/relationships fail | **PASS** (ADV + harness) |
| Same email safe across orgs | **PASS** |
| Duplicate prevention org-scoped | **PASS** |
| Guardian subject-specific | **PASS** |
| Expired guardian fails immediately | **PASS** |
| Age-of-majority at access time | **PASS** |
| Former/inactive members lose access | **PASS** (ADV-7) |
| Archived/deleted follow blueprint | **PASS** (ADV-9/10, ARCHIVED-RESTRICT) |
| Imports cannot assign/elevate PlatformRole | **PASS** |
| Exports field-level redaction | **PASS** |
| Migrations/provisioning idempotent | **PASS** |
| Partial migration recovery no duplicates | **PASS** (ADV-14/15) |
| CTP fulfillment creates/links Person only when enabled | **PASS** (OFF noop / ON ensure) |
| Rollback preserves data, disables access | **PASS** (ADV-22 / ROLLBACK-RETAIN) |
| Audit events for protected mutations | **PASS** |
| OpenFGA projector non-authoritative | **PASS** |
| Minimal People page desktop + mobile | **PASS** (smoke HTML screenshots; live page behind Trust legal shell — condition) |
| No Tasks / Novu / RJSF / industry-portal runtime | **PASS** |
| Phase 1 fully functional; default OFF unchanged | **PASS** |

---

## 5. Screenshots and evidence

| Artifact | Purpose |
|---|---|
| `docs/audits/runtime-evidence-people-phase2a/cert-summary.json` | Full in-process matrix (25/0) |
| `http-probes.json` | Unauthenticated HTTP statuses |
| `http-auth-probes.json` | Flag ON authenticated API/page (6/0) |
| `http-flag-off-auth-probes.json` | Flag OFF authenticated API/page (7/0) |
| `people-nav-smoke.html` | Minimal People UI fixture |
| `people-desktop.png` | Desktop smoke render |
| `people-mobile-390.png` | Mobile 390px smoke render |

---

## 6. Console / server / network errors

| Source | Observation |
|---|---|
| Next flag OFF | People APIs **404**; merge/import GET **404** after fix; page auth → not-found |
| Next flag ON | People APIs **401/403/200** as expected; no 5xx on cert paths |
| Browser smoke | No console errors on static smoke page |
| Legal gate | Authenticated `/portal/demo-client/people` with pending trust docs shows LegalReacceptanceShell (“A few documents need a quiet look”) — portal-wide, not People-specific |
| Production Airtable | No People table writes. In-memory store only. Org id may resolve from local slug lookup (`rec…`) but Person rows stay in-process memory |

---

## 7. Defects and fixes

| Defect | Severity | Action | Re-test |
|---|---|---|---|
| `GET /people/merge` and `GET /people/import` returned **405** when flag OFF (route existence leak; violated hard-404) | Medium | Added GET handlers that call `guardPeopleApi` first (`merge/route.ts`, `import/route.ts`) | Flag OFF GET → **404**; ADV 22/22; auth suites re-run |

No other Phase 2A code defects found.

---

## 8. Conditions (why not unqualified PASS)

1. **Unauthenticated People page is 307 → login**, not bare 404. Hard 404 / not-found applies after session (or immediately on APIs). Matches portal middleware-before-page ordering; harness allows “auth redirect then 404”.
2. **Authenticated People page may be wrapped by `LegalReacceptanceShell`** when trust docs require acceptance. People APIs still ACL-correct; visual shell certified via smoke HTML until legal gate clears for the tenant.
3. **People persistence remains in-memory** for Phase 2A foundation (known implementation scope) — cert used synthetic fixtures only.
4. **Main harness HTTP “flag ON” labels** do not mutate the Next process env; dedicated ON server run + `http-auth-probes.json` is the live ON evidence.

---

## 9. Commit / deploy posture

| Action | Allowed now? |
|---|---|
| Commit | **No** — wait for explicit request |
| Push | **No** |
| Deploy | **No** |
| Production `UNIVERSAL_PEOPLE` | Keep **OFF** |

---

## Final verdict

**PASS WITH CONDITIONS**
