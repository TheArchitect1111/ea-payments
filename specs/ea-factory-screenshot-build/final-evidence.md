# EA Factory Screenshot Build Mode — final local continuation evidence

**Branch:** `work/ayf-chassis-20261103` · **Starting commit:** `cea567f7` · **State:** locally implemented and scoped acceptance tested; NOT DEPLOYED, NOT production VERIFIED, NOT DONE. **AYF ready: NO.**

All existing changes, untracked logs and user test directories were preserved. At acceptance-run time no commit, push, deployment, public publishing, customer email, live payment or production data mutation was performed. The subsequent user authorization permits a local commit of this implementation and evidence only. The dedicated worker was not started as a service; its browser executor and request boundary were exercised inside controlled tests.

## Authoritative results

Portable commit evidence: [consolidated summary](evidence/consolidated-summary.json), [browser acceptance](evidence/browser-acceptance.json), and [worker acceptance](evidence/worker-acceptance.json). These curated records preserve outcomes, receipt metadata and hashes of the original reports/logs. Raw Temp logs, generated capture rows, browser rasters and session credentials are excluded. The Temp paths below identify the original local evidence; they are not repository dependencies. No acceptance tests were rerun for commit preparation.

- [Consolidated machine report](C:/Users/brick/AppData/Local/Temp/ea-screenshot-consolidated-1793753153141/report.json): **21 PASS jobs, 1 FAIL job**. Earlier failures and subsequent repair logs remain in each job's history.
- [Website → login → intake/applications browser evidence](C:/Users/brick/AppData/Local/Temp/ea-screenshot-qeMYfL/evidence.json): six actual behavioral check receipts, final state `draft_ready`.
- [Runnable worker browser evidence](C:/Users/brick/AppData/Local/Temp/ea-screenshot-qeMYfL/worker/browser-evidence.json): rendering, navigation, authenticated session access, persistence/read-back, authorization and tenant isolation PASS. Intentionally mismatched synthetic desktop reference FAILS comparison; missing approved mobile references are BLOCKED. Neither visual result is promoted to acceptance.
- [Full TypeScript diagnostics](C:/Users/brick/AppData/Local/Temp/ea-screenshot-consolidated-1793753153141/types-attempt2.log): 413 repository diagnostics; no diagnostics in the screenshot implementation, worker, screenshot tests, repaired AYF fixture or new transport fixtures.

The consolidated command was `node scripts/test-factory-screenshot-acceptance.mjs`. It ran the initial broad campaign once. Repairs were tested with `--resume ... --only=...`, then exact behavioral name filters; passing security, release and regression jobs were retained rather than rerun. The original behavioral group had 55/56 passing cases. Its sole browser failure was repaired and extended, and the added signed-worker test passed separately. Current source contains nine screenshot feature scenarios; all have passing coverage across this campaign. The earlier 50-tenant synthetic assembly pass was retained.

## PASS / FAIL / BLOCKED matrix

| Item | Status | Evidence / exact reason |
| --- | --- | --- |
| AYF existing chassis regression | PASS | Real Postgres adapter now runs against controlled PostgREST transport with schema-profile, gateway/JWT and exact organization-header assertions. Installed manifest/receipts are checked. Production runtime checks remain unchanged. |
| Missing People flags, credentials and schema | PASS (negative tests) | Each rejects AYF foundation before organization/entitlement writes. No memory fallback or automatic flag enablement was added. |
| Screenshot website/portal navigation | PASS locally | Chromium follows private page links, receives unauthorized denial before login, and reaches actual intake/application page rendering after authorized session issuance. |
| Canonical capture → existing portal ledger | PASS locally | Both durable stores are read back. Native browser POST redirects to existing portal; actual portal page shows the saved member's submission. |
| Intake and application forms | PASS locally | Both configured capture kinds persist and appear in their corresponding existing portal pages. No email/payment lifecycle handlers run. |
| Replay, partial failure and dropped writes | PASS | Same canonical/ledger identities are retained. Reviewed ledger status survives replay. Canonical failure, null ledger write, unavailable storage and dropped-write/read-back mismatch reject success; retry repairs the same capture. |
| Login and session integrity | PASS locally | Actual login handler and HMAC signing/verification run against controlled identity transport. Wrong password produces no session; tampered/expired sessions reject. The tests do not certify live identity-provider availability. |
| Permissions and tenant isolation | PASS locally | Active member/module admission required. Inactive member, disabled module, wrong tenant, anonymous access, changed identity and cross-origin writes reject. Actual portal ledger filters hide another member's and another tenant's rows. |
| Private assets/reference screenshots | PASS | Anonymous access rejects, bound logo renders, unbound asset rejects, original PNG bytes match and a changed source hash rejects. |
| Signed browser worker | PASS locally | HMAC/timestamp validation, request size/schema/tenant boundaries, retry deduplication and recoverable failure handling tested. Browser executor runs against actual private handlers and portal pages. Production/preview cannot enable loopback HTTP. |
| Desktop fidelity mismatch detector | PASS (negative test) | Worker reports FAIL for the deliberately incomplete synthetic interpretation: pixel difference **0.11579 > 0.005**. This is expected rejection evidence, not a successful visual reconstruction claim. |
| Real AYF visual fidelity | BLOCKED | No approved real AYF screenshot/reference packet or live vision run. Approved mobile references are absent. Layout fidelity must pass the actual comparator before COMPLETE. |
| Factory production/capability regressions | PASS | Stale website-only fixtures now execute all five registered builders, including the `content` work-order type. Unsupported work remains pending for its owner; execution contracts and pending review gates remain mandatory. |
| Identity concept status regression | PASS | Test now checks the current exact “Ready to review” label. Concept selection/approval behavior remains unchanged. |
| Experience Creation Engine content regression | PASS | A generated default CTA used a slogan prohibited by its own content gate. Default copy was corrected; the forbidden-copy gate was not relaxed. |
| Selected-concept wiring and Quick Launch review | PASS | Existing regression scripts pass. Ordinary concept approval remains in place. |
| Security/certification/release guards | PASS | Production protection, tenant release safety, release guardrails, master guard, system registry, tenant safety, strict Lego authority, final certification, Airtable read hardening and factory torture certification all pass. |
| Scoped ESLint | PASS | Latest changed implementation, worker, route, fixtures and repaired regression scripts pass with no errors/warnings. |
| Repository-wide TypeScript / full release | FAIL | **413 code/type diagnostics**, not missing external services. Breakdown: app 52, lib 107, scripts 216, src 20, tests 7, services 3, Playwright config 4, tools 2, vendor 2. Raw log contains every path/code/reason. Examples include missing `CreativeCampaign`, possibly undefined Amanda offer values and incomplete vendor `WebsiteAssembly` fields. No exclusions, casts or relaxed compiler settings were added to hide them. Full build/release is not certified. |
| Worker activation in an AYF private environment | BLOCKED | Runnable source exists. The environment lacks the test tenant data/session fixtures and storage/provider configuration below. A production/preview worker additionally needs trusted HTTPS hosting; deployment was expressly prohibited. This is delivery/configuration work, not an unimplemented browser runner or an additional missing vendor credential. |
| Real AYF end-to-end acceptance | BLOCKED | Real inputs, provider-backed tenant data, approved test memberships and all eight behavioral/visual receipts have not been exercised together. No AYF project was created, duplicated or modified. |

## Repairs delivered in this continuation

1. `lib/factory-screenshot-submit.ts` bridges canonical submissions into the existing durable portal review ledger, verifies exact read-back and returns the existing intake/application destination. The submit route redirects native browser requests there after persistence succeeds.
2. `tests/fixtures/people-runtime.ts` repairs the AYF test environment without replacing the real People adapter or weakening production flags/readiness. `tests/chassis-autowire.test.mts` verifies successful admission and missing-runtime/schema rejection before writes.
3. `tests/fixtures/screenshot-ledger.ts` supplies disk-backed provider transport for the actual portal ledger. Tests use actual login/HMAC, capture/ledger logic, intake/applications page components and member/module guards; provider identity/storage transports and portal layout chrome are controlled fixtures.
4. `lib/factory-screenshot-browser-worker.ts` and `scripts/serve-factory-screenshot-verifier.mts` implement the previously missing runnable worker. It uses pre-issued explicitly scoped test sessions, not password/2FA/email actions. It records real browser outcomes, compares actual pixels and blocks missing references/fixtures.
5. Stale production/capability/identity regression fixtures and the forbidden default CTA were repaired. Security and certification contracts remain intact.
6. `scripts/test-factory-screenshot-acceptance.mjs` produces one resumable offline campaign with per-job logs and retained failure history. `tests/fixtures/network-offline.cjs` blocks accidental external fetches outside controlled test transports/localhost.

## Genuine external blockers remaining: 4

Configuration presence was inspected without printing secret values or making provider calls. These are separate from the internal TypeScript failure above.

| ID | External dependency | Observed status | Precise action required |
| --- | --- | --- | --- |
| E1 | Existing screenshot vision provider | `ANTHROPIC_API_KEY` / `CLAUDE_API_KEY` absent | Provide the approved existing provider credential in the private execution environment; process actual AYF image bytes and validate/cache the structured interpretations. Do not substitute mock interpretations or branding defaults. |
| E2 | Durable Airtable platform storage/identity data | `AIRTABLE_API_KEY` / `AIRTABLE_PAT` absent | Supply a scoped credential for the approved base and required Creative Studio, organization/membership/entitlement, client identity and Portal Form Submissions tables; verify durable private draft and canonical-capture/portal-ledger read-back using authorized test records. |
| E3 | People durable Postgres/PostgREST runtime | Dedicated credentials absent; People and persistence flags OFF | Connect the approved `people` schema with its existing RLS/tenant contract and dedicated gateway key + `people_app` JWT credentials. Verify provider/schema readiness, then enable `UNIVERSAL_PEOPLE` and `UNIVERSAL_PEOPLE_PERSIST` in the authorized private environment and rerun AYF manifest admission. Do not enable flags alone or use memory/service-role fallback. |
| E4 | Approved real AYF acceptance packet | Real AYF screenshots/assets/mobile references, confirmed business bindings/role matrix and test identities not supplied | Supply the approved website/portal reference set and expected navigation/form/role behavior, plus active same-tenant and independent second-tenant test sessions. Assemble against the preserved canonical AYF project/manifest and run all eight worker checks against its actual private preview. Every failed criterion must be repaired and reverified. |

The worker URL/secret is no longer counted as a missing external implementation: the source and local loopback path are delivered and tested. It still must be activated with the explicitly authorized test fixtures and, outside local development, HTTPS infrastructure. No public deployment or production inspection was attempted under the user's prohibition.

**AYF readiness remains NO.** Passing controlled local tests does not replace real AYF provider, identity, persistence, permission and visual acceptance evidence.
