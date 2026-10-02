# Amanda LMS locked v2.1 — review change summary

Same branch: `fix/amanda-lms-locked-v2-20261002`. Starting local commit `7a8bb50`. Remote starting review commit `257ca74d4241a04527d23624113616f227fdfcc9` has the exact tree of local `a2eeb9a`; the authorized review push includes the preceding local menu repair and this v2.1 update. Git chooses actual commit hashes; `7a8bb51` cannot be assigned as a requested identifier.

Status: **IMPLEMENTED PARTIAL REPAIR / OVERALL HOLD**. Three of the 17 formerly unavailable labels now have existing real functions behind them. Fourteen remain absent; no unrelated destinations, fake data or broadened permissions are substituted. No master edits, merge or production promotion.

## v2.1 changes, file by file

| File | Change |
|---|---|
| `specs/amanda-lms-locked-v2/SOURCE_OF_TRUTH_v2.1_FINAL.md` | Verbatim extraction of the supplied final PDF; current authority supersedes prior shipping/scheduling values. |
| `lib/amanda-catherine/kit-fulfillment.ts` | Removes paid-rate configuration/lookup/charge code. Both modes return zero shipping, shipment retains required normalized address. Includes the requested future-paid-shipping TODO. |
| `lib/amanda-catherine/practitioner-kit-orders.ts` | Updates actual paid-order validation to accept only $0 shipping for both modes, retain shipment address checks and Stripe-total/tenant/payment checks. Preview validation test passes; production persistence unverified. |
| `app/components/amanda/KitFulfillmentFields.tsx` | Ship to me - FREE; both options clearly show $0 CAD; address fields retained. |
| `app/amanda-catherine/private/practitioner-kit/page.tsx` | Removes paid-shipping copy; retains standalone kit price and all approved assets. |
| `lib/amanda-catherine/support-config.ts` | Reuses approved existing Jane destination and existing Gmail identity. Validates Jane HTTPS override, rejects credentials/lookalike/general URLs and falls back to existing approved Jane URL. |
| `app/portal/amanda-catherine/support/page.tsx` | Uses Jane provider configuration and Gmail address for each assigned course or no-assignment support panel. Example URL and guessed scheduling behavior removed. |
| `app/components/amanda/AmandaSupport.tsx` | Gmail-address email action and real Jane booking link; pending-example notice removed; exact support text, unique accessible IDs and training-date countdown retained. |
| `app/portal/[slug]/member/AmandaMemberHome.tsx` | Member Profile -> real session-profile page; Member Resources and Protocols/Templates -> protected course-resource view; Product Ordering -> existing kit checkout. Other absent workflows remain visible/unavailable. |
| `app/portal/amanda-catherine/profile/page.tsx` | Read-only member account view using existing exact-tenant module guard and session identity; missing email redirects to login preserving return URL. |
| `lib/amanda-catherine/member-resources.ts` | Selects existing resource catalog only for deduplicated purchased READY course IDs. |
| `app/portal/amanda-catherine/resources/page.tsx` | Displays selected protected resource links and existing private-delivery action, using signed-in email and durable assignments. Existing download API independently rechecks access. No clinical data or grants invented. |
| `lib/amanda-catherine/lms-policy.ts` | Updates authority reference to v2.1; readiness and support clock behavior unchanged. |
| `scripts/test-amanda-kit-shipping.ts` | Tests both $0 modes, retained addresses, missing/invalid address rejection, and stale or invalid paid config never charging shipment. No Stripe network calls. Also exercises the real order recorder in preview mode for standalone and tuition-included kits; unpaid, wrong total, other-tenant, nonzero shipping and missing-address fixtures reject. |
| `scripts/test-amanda-support-render.tsx` | Tests actual support rendering, Jane host/override validation, Gmail-address email label, exact wording and training-date end date. |
| `scripts/test-amanda-lms-locked-v2.ts` | Adds protected resource selection tests and profile/resource/kit menu integration checks; previous policy/login boundary tests retained. |
| `specs/amanda-lms-locked-v2/spec.md` | Establishes v2.1 authority and free-shipping/provider acceptance; old temporary inputs explicitly superseded. |
| `specs/amanda-lms-locked-v2/plan.md` | Updates shipping architecture and current verification blockers. |
| `specs/amanda-lms-locked-v2/tasks.md` | Records approved inputs, supported function repairs, remaining missing implementations and review-only push authorization. |
| `specs/amanda-lms-locked-v2/menu-wiring-audit.md` | Current complete label/function inventory, evidence and all remaining HOLD/UNVERIFIED rows. |
| `specs/amanda-lms-locked-v2/diff-summary.md` | This current review evidence. |

## Preceding local repair included in review push

Local `7a8bb50` supplies purchase/readiness-aware per-course groups for learner/staff/admin menus, explicit non-course mappings, removal of misleading generic member-dashboard fallbacks, existing authoring/document links beside certification review, book action readiness routing, unique support IDs and regression tests. Its temporary paid rates/example schedule have been removed by v2.1. Owner scope limitations remain unchanged and recorded in the audit.

## Observed verification

- PASS: `node --import tsx scripts/test-amanda-lms-locked-v2.ts`.
- PASS: `node --import tsx scripts/test-amanda-kit-shipping.ts`.
- PASS: `TSX_TSCONFIG_PATH=scripts/amanda-lms-test.tsconfig.json node --import tsx scripts/test-amanda-support-render.tsx`.
- PASS: `npm run test:amanda-checkout`.
- PASS: targeted `npm run lint -- [changed files]`, 0 errors and 1 existing image warning.
- PASS: `git diff --check`.
- PASS: new profile logged-out local HTTP 307 preserves `/portal/amanda-catherine/profile?view=account` in login `next`. This does not prove authenticated login or data rendering.
- BLOCKED: repository-wide lint exits 2 for missing `react-hooks` plugin configuration.
- FAIL: repository-wide type check exits 2 with 342 diagnostics; no diagnostics in changed files in inspected output.
- FAIL: tenant-safety assertion at line 86, unchanged shared production entitlement function. Shared tenant code and test were not altered to manufacture a pass.

## Required next work

Fourteen menu workflows remain missing; their exact labels and repository evidence are in the audit. Gmail-address email wiring does not certify a Gmail mailbox OAuth integration, which is absent from this repository. Approved QA access is still required for authenticated learner/admin, course download/unlock, payment/fulfillment, waitlist persistence, scheduled support, certification, mobile and complete menu tests.

Overall audit remains HOLD until required functions and access rules are observed. Robert authorized pushing this branch for review only; no merge or production promotion.

## Waitlist follow-up on published review 959c728

| File | Change / observed evidence |
|---|---|
| `components/amanda/AmandaWaitlistForm.tsx` | Five labeled fields, auto-filled interest, exact confirmation only after save and notification success; busy and error feedback. |
| `lib/amanda-catherine/waitlist-interests.ts` | Approved catalog NOT READY courses plus explicit 14 service interests authorized in latest instruction; rejects unknown/READY interests. |
| `lib/amanda-catherine/waitlist.ts` | PDF snippet adaptation, dedicated Airtable persistence then Amanda notification; no invented admin route, checkout or entitlement. |
| `lib/email/gmail.ts` | Actual server-only Gmail OAuth refresh and messages.send transport; no mailto fallback; runtime credentials unavailable, live send Unverified. |
| `app/api/public/amanda/waitlist/route.ts` | Origin/rate/field validation, canonical interest lookup, durable-save requirement and separate notification failure handling. |
| `app/amanda-catherine/courses/[courseSlug]/page.tsx` | Public anchored form for NOT READY courses/services, unknown 404, READY redirects to existing sales page. |
| `lib/amanda-catherine/menu-routing.ts` | NOT READY routes canonical public waitlist; purchased READY learning and unpurchased READY sales retained. |
| `app/portal/[slug]/member/AmandaMemberHome.tsx` | All 14 known unavailable functions now have explicitly registered waitlist routes. |
| `app/portal/amanda-catherine/waitlist/WaitlistForm.tsx` | Existing entry point delegates to new full form; no divergent submission flow. |
| `app/courses/[courseSlug]/page.tsx` | Existing sales waitlist shares new form; corrects stale shipping copy to FREE. |
| `app/amanda-catherine/page.tsx` | Public NOT READY links use canonical path; stale shipping copy corrected to FREE. |
| `scripts/test-amanda-lms-locked-v2.ts` | Existing routing expectations updated; policy suite PASS. |
| `scripts/test-amanda-waitlist.ts` | Mocked storage/Gmail success and failure, catalog and menu coverage, READY/unknown/origin rejection PASS. |
| `specs/amanda-lms-locked-v2/menu-wiring-audit.md` | Row dispositions and concrete live QA plans; HOLD preserved, shared failing-check evidence retained. |

External provision: created `amanda_waitlist` table `tblIgxYkeHnuvg6eK` in the verified existing Payments & Clients base. No student record or real email was created. No deployment or merge.

## Shared tenant assertion and environment documentation follow-up

- `scripts/test-tenant-safety.mjs`: asserts the exact three registry chassis modules and production empty-input branch; no package fallback or entitlement-gated modules. Correct policy/checkpoint comment. Tenant-safety command PASS.
- `docs/VERCEL_ENV.md`: exact runtime names, reserved unused AMANDA_GMAIL_USER, durable-save versus verified-delivery distinction; no secrets or runtime changes.
- `menu-wiring-audit.md`: latest passing tenant-safety evidence and externally hosted live 404 investigation; remaining verification HOLD retained.
