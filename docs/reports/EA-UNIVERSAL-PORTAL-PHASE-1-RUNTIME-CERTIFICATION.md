# EA Universal Portal — Phase 1 Runtime Certification

**Status:** Certified (not committed / not pushed / not deployed)  
**Blueprint:** [docs/plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md](../plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md)  
**Implementation:** [docs/reports/EA-UNIVERSAL-PORTAL-PHASE-1-IMPLEMENTATION.md](./EA-UNIVERSAL-PORTAL-PHASE-1-IMPLEMENTATION.md)  
**Certification date:** 2026-07-25 (evidence) · report finalized 2026-07-26  
**Scope:** Phase 1 only — IndustryPack schema, nav/branding resolution, feature flag. No People / Tasks / Novu / RJSF runtime.

---

## Verdict

**PASS — ready to commit**

All required Phase 1 runtime checks passed (17/17). No Phase 1 defects were found; no code fixes were required during certification. Do not push or deploy until explicitly requested. Keep `UNIVERSAL_NAV_PACKS` default **OFF** in production until a deliberate cutover.

---

## 1. Method

| Item | Detail |
|---|---|
| Harnesses | `scripts/runtime-cert-universal-portal-phase1.mts`, `scripts/test-industry-pack-runtime-cert.mts` |
| Supporting tests | `scripts/test-industry-pack-contract.mjs`, `scripts/test-industry-pack-unit.mts`, `scripts/test-industry-pack-provisioning-regression.mjs` |
| Runtime | Local Next.js at `http://localhost:3000` + in-process TS module resolution |
| Fixtures | `demo-client`, `ea`, synthetic `org-alpha` / `org-beta` (no production Airtable writes) |
| Evidence root | `docs/audits/runtime-evidence-universal-portal-phase1/` |
| Machine summary | `docs/audits/runtime-evidence-universal-portal-phase1/cert-summary.json` (17 pass / 0 fail) |
| Alternate matrix | `docs/audits/runtime-evidence-universal-portal-phase1.json` (17 pass / 0 fail) |

Flag states exercised:

| State | How set | Expected behavior |
|---|---|---|
| OFF | `UNIVERSAL_NAV_PACKS` unset | Legacy CX nav + legacy executive sidebar |
| OFF | `UNIVERSAL_NAV_PACKS=0` | Same as unset |
| ON | `UNIVERSAL_NAV_PACKS=1` | Pack-driven CX + executive nav/branding |

Pack IDs tested: `ea-executive`, `ctp-client`, `sample-placeholder`, `does-not-exist` (fallback).  
Roles tested: `guest`, `member` / `staff`, `owner`, client CX shell.

---

## 2. Routes tested

| Route | Flag | Result |
|---|---|---|
| `/portal/login` | ON | HTTP 200 |
| `/portal/demo-client/ctp` | ON | HTTP 307 → auth gate (expected unauthenticated) |
| `/portal/demo-client/ctp/progress` | ON | HTTP 307 |
| `/portal/demo-client/ctp/documents` | ON | HTTP 307 |
| `/portal/demo-client/ctp/messages` | ON | HTTP 307 |
| `/portal/demo-client/ctp/support` | ON | HTTP 307 |
| `/portal/ea` | ON | HTTP 307 |
| `/portal/ea` (+ module hrefs: pulse, simplifi, amplifi, connect, updates, documents, messaging, events, resources, learning, ask, ctp, member, billing) | ON | Resolved via `ea-executive` pack (in-process) |
| `/portal/demo-client/ctp/*` five CX destinations | OFF and ON | Labels/order/hrefs certified in-process |
| `/portal/org-alpha/*` vs `/portal/org-beta/*` | ON | Slug-scoped hrefs; no cross-org leakage |

Evidence: `docs/audits/runtime-evidence-universal-portal-phase1/http-probes.json`

---

## 3. Certification matrix

| ID | Routes / surface | Roles | Pack IDs | Flag | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|---|---|
| FLAG-OFF-CX-LEGACY | `/portal/demo-client/ctp/*` | client | (unused) | OFF | Unset → legacy 5 CX items | `flag=false`; progress/documents/messages/support/journey with legacy labels | **PASS** |
| FLAG-0-CX-LEGACY | `/portal/demo-client/ctp/*` | client | (unused) | OFF (`0`) | `=0` → legacy | `flag=false`; len=5; first=`progress:Your Project` | **PASS** |
| FLAG-ON-CTP-CLIENT | CX five routes | client | `ctp-client` | ON | Prefer CX → `ctp-client`; pack labels/order | `pack=ctp-client`; order=progress→documents→messages→support→journey | **PASS** |
| FLAG-ON-EA-EXECUTIVE | `/portal/ea` | owner | `ea-executive` | ON | Default executive pack; Billing; no people/tasks | 15 items; Dashboard→Pulse→Simplifi…; Billing present; people/tasks absent | **PASS** |
| SAMPLE-PLACEHOLDER-SAFE | registry only | N/A | `sample-placeholder` | N/A | Validates; never default production | `ok=true`; default=`ea-executive`; CX=`ctp-client` | **PASS** |
| ROLE-BILLING-MIN-OWNER | `/portal/ea` billing item | guest vs owner (also staff in alt harness) | `ea-executive` | ON | Billing only for owner | guest/staff hide; owner shows | **PASS** |
| JOURNEY-STAGE-FILTER | `resolveIndustryNav` | guest | synthetic `stage-cert` | ON | Welcome empty; Agreement visible | welcome=0; agreement=1 (+ docs in alt harness) | **PASS** |
| ENTITLEMENTS-STRIP | nav resolution | guest | `sample-placeholder` / `ea-executive` | ON | Unauthorized modules removed | only entitled modules; Simplifi/Billing stripped when not entitled | **PASS** |
| UNKNOWN-PACK-FALLBACK | `resolvePackForOrg` | N/A | `does-not-exist` → `ea-executive` | ON | Safe fallback + warn | fallback=`ea-executive`; warns logged | **PASS** |
| INVALID-SCHEMA-FAIL | `validateIndustryPack` | N/A | synthetic invalid | N/A | Bad version/id / people.enabled fail | all `ok=false`; registry packs still valid | **PASS** |
| BRANDING-MERGE-PROTECTED | `applyPackBrandingToChrome` | N/A | `sample-placeholder` | ON | Org logo protected; terminology applied | org logo kept; home=`Chapter Home`; pack logo only when no org logo | **PASS** |
| FULFILL-UNCHANGED | `lib/fulfill-paid-client.ts` | N/A | N/A | N/A | No Phase 1 coupling | no `portal-universal` / pack refs | **PASS** |
| NO-LATER-PHASE-RUNTIME | packs + wire files | N/A | all three packs | N/A | No People/Tasks/Novu/RJSF runtime | extensions off; empty people/tasks maps; no `@rjsf`/`@novu` imports | **PASS** |
| CROSS-ORG-ISOLATION | org-alpha vs org-beta | client / executive | ctp / executive / sample | ON | No cross-slug href or pack leakage | `hrefLeak=false`; slug→pack map isolated | **PASS** |
| CX-DESTINATION-PARITY | `/portal/demo-client/ctp/*` | client | `ctp-client` vs legacy | ON | Same five destinations as legacy | parity OK | **PASS** |
| NAV-STRUCTURE-DESKTOP-MOBILE | sidebar + CX chrome | member + client | `ea-executive`, `ctp-client` | ON | Usable labels/hrefs; no `{slug}` leftovers | execItems=12; badHref=0; cxItems=5 | **PASS** |
| HTTP-LOCAL-ROUTES | login + CX + ea | unauthenticated | N/A | ON | 200 or auth redirect; no 500 | login=200; portals=307 | **PASS** |

---

## 4. Requirement checklist (user brief)

| Requirement | Result |
|---|---|
| Legacy navigation unchanged with flag OFF | **PASS** |
| `ea-executive` resolves correctly with flag ON | **PASS** |
| `ctp-client` resolves correctly with flag ON | **PASS** |
| `sample-placeholder` validates without becoming a production portal | **PASS** |
| Navigation labels, order, visibility match each pack | **PASS** |
| Role restrictions work | **PASS** |
| Journey-stage restrictions work | **PASS** |
| Entitlements and RBAC still remove unauthorized entries | **PASS** |
| Unknown/invalid pack IDs fall back safely | **PASS** |
| Invalid schema versions fail safely | **PASS** |
| Branding merges without overriding protected values | **PASS** |
| Existing CTP fulfillment remains unchanged | **PASS** |
| No People, Tasks, Novu or RJSF runtime activated | **PASS** |
| Desktop and mobile navigation render without overlap/broken controls | **PASS** (structure + smoke visuals) |
| No cross-organization navigation or data leakage | **PASS** |

---

## 5. Screenshots and runtime evidence

| Artifact | Purpose |
|---|---|
| `docs/audits/runtime-evidence-universal-portal-phase1/cert-summary.json` | Full row matrix + HTTP results |
| `docs/audits/runtime-evidence-universal-portal-phase1.json` | Alternate harness matrix (17/0) |
| `flag-off-cx.json` | Legacy CX nav snapshot |
| `flag-on-ctp-client.json` | Pack-driven CX nav |
| `flag-on-ea-executive.json` | Executive resolved nav + sidebar groups |
| `nav-structure.json` | Desktop/mobile chrome structure |
| `http-probes.json` | Local HTTP status codes |
| `cx-nav-smoke.html` | CX nav smoke render |
| `cx-nav-desktop.png` | Desktop CX nav visual |
| `cx-nav-mobile-390.png` | Mobile (390px) CX nav visual |

---

## 6. Console / server / network errors

| Source | Observation |
|---|---|
| HTTP probes | No 5xx. Portal deep links return **307** without session (auth gate) — expected. |
| Pack fallback | Intentional `console.warn` for unknown `industryPackId` (2 warns during UNKNOWN-PACK-FALLBACK) — expected safe path. |
| Server logs during probes | No Phase 1 crash / uncaught exception attributed to IndustryPack resolution. |
| Browser console (smoke) | No broken-control / overlap defects noted on CX smoke desktop/mobile captures. |

No production records were created. Demo/local fixtures only.

---

## 7. Defects and fixes

| Defect | Severity | Action |
|---|---|---|
| None found in Phase 1 scope | — | No code changes required during certification |

---

## 8. Commit / deploy posture

| Action | Allowed now? |
|---|---|
| Commit Phase 1 + this report | **Yes** (on request only) |
| Push | No (not requested) |
| Deploy / enable `UNIVERSAL_NAV_PACKS=1` in production | No — default OFF; enable only after deliberate cutover |

Recommended post-commit (not blockers for commit): enable flag on a local or preview session with an authenticated `demo-client` / `ea` cookie and spot-check PortalShell + CX chrome once more before any production flag flip.

---

## Verdict (repeat)

**PASS — ready to commit**
