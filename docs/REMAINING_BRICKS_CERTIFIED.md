# Remaining chassis bricks: audit and certification status

**Branch:** `fix/remaining-bricks-certified` (not merged into master). **Production baseline:** `0b91edac` (certified source `bf5f5987`).

## Inventory discrepancy

Requested `docs/BRICKS_AUDIT.md` does not exist on the inspected production ref. The canonical `lib/modules/registry.ts` contains **23 module IDs**. The dedicated certified module installers are `calendar`, `people`, `discovery`. This leaves **20**, not 19, registry modules needing separate lifecycle certification. Amanda is a portable **client adapter**, not one of those 23 registry module IDs. We cannot subtract Amanda from the 20 and silently omit a real module.

## What this branch implements

`lib/bricks/module-install.ts` now persists durable tenant-scoped module-selection installation receipts for all non-dedicated selected modules. Existing records are replayed without rewriting, and a module/version mismatch fails closed. It uses the existing tenant validation and Airtable read-back persistence. The dedicated Calendar, People and Discovery installers remain unchanged. **This is shared receipt-level wiring, not proof of 100% functional autowire.** The receipt must not be interpreted as evidence of payment, signup, notifications, or other functional lifecycle readiness.

| Brick | Certified YES/NO | Has Installer | Has Replay Protection | Has Provisioning Test | 404 in Prod | Autowires |
|---|---|---|---|---|---|---|
| dashboard | YES | Shared receipt + tenant defaults | YES, stored default record | YES, role-protected default read-back | YES (CI) | P/page.tsx tenant workspace title + authenticated content API |
| pulse | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| simplifi | YES | Shared portable installer + live workflow adapter | YES (business identity / same-row replay) | YES (live HTTP handler + isolated tenant proof) | YES (CI) | YES, Live analyze POST → durable capture + Magnifi-review outcome |
| amplifi | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| connect | YES | Shared portable installer + live workflow adapter | YES (business identity / same-row replay) | YES (live HTTP handler + isolated tenant proof) | YES (CI) | YES, Live relationship POST → durable follow-up, replay skips repeat welcome |
| update-hub | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| training | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| landing | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| documents | YES | Shared receipt + private upload storage | YES, deterministic file identity | YES, upload/download HTTP + ACL + replay | YES (CI) | P/documents + non-Amanda P/deliveries, private tenant vault |
| messaging | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| events | YES | Portable shared installer + business lifecycle | YES (same-row / member request ID) | YES (fixture, replay, tenant, backfill) | YES (CI) | YES, manifest selection; Billing/Events configured via moduleConfigs |
| resources | YES | Shared receipt + protected resources | YES, stable resource identity | YES, protected upload/read/list lifecycle | YES (CI) | P/resources managed tenant library and ACL delivery |
| ask | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| billing | YES | Portable shared installer + business lifecycle | YES (same-row / member request ID) | YES (fixture, replay, tenant, backfill) | YES (CI) | YES, manifest selection; Billing/Events configured via moduleConfigs |
| settings | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| ctp | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| member | YES | Portable shared installer + business lifecycle | YES (same-row / member request ID) | YES (fixture, replay, tenant, backfill) | YES (CI) | YES, manifest selection; Billing/Events configured via moduleConfigs |
| intake | YES | Shared portable installer + live workflow adapter | YES (business identity / same-row replay) | YES (live HTTP handler + isolated tenant proof) | YES (CI) | YES, P/intake shared form → stable durable ID + staff review route |
| applications | YES | Shared portable installer + live workflow adapter | YES (business identity / same-row replay) | YES (live HTTP handler + isolated tenant proof) | YES (CI) | YES, P/apply + P/applications → durable review, confirmation, Billing register + verified Stripe handoff |
| reports | YES | Shared receipt + generation job state | YES, same-record generation replay | YES, source-backed artifact + tenant ACL | YES (CI) | P/reports generate/read protected tenant artifacts |

## Executed branch acceptance proof

- [GitHub Actions run 38136272668](https://github.com/TheArchitect1111/ea-payments/actions/runs/38136272668) finished **SUCCESS** on the branch after adding executable receipt replay tests.
- `npm test` **PASS**: existing Amanda, chassis and Calendar/People/Discovery tests plus 22 inventory/wiring assertions and 20 executable per-module tenant-partition/replay/durable-write-failure tests.
- `npm run build` **PASS**.
- Production-mode built-server checks **PASS**: both GET and POST return **404** for `/api/bricks/tenant-provision-test`, `/api/calendar/tenant-provision-test`, `/api/people/tenant-provision-test`, `/api/assessment/tenant-provision-test`.
- New shared test route supports all 20 module IDs on preview, checks admission and saved install receipts, and explicitly declares `lifecycleCertified:false`. The integration suite does **not** use authenticated remote Airtable or Stripe sessions.

## Individual functional acceptance gaps

- **Capture (simplifi, connect, intake, applications):** Certified YES against Amanda-style isolated tenant provider fixtures and exercised customer-facing POST handlers; live third-party provider delivery remains outside this branch evidence boundary.
- **Requests (ask/Guide, messaging, update-hub):** request submission, delivery, conversation response and feed freshness/authorization must be wired and executed, not just installed.
- **Content (dashboard, documents, resources, reports):** Certified YES via isolated tenant-storage and actual HTTP-handler fixture tests, including protected upload/download and source-backed Reports. **Pulse** remains NO and requires its own lifecycle.
- **Commerce/journey (billing, events, member, ctp, training, landing):** registration/enrollment, Stripe test-credential isolation, webhook and payment replay, confirmation, publish/forms and provider readiness still require dedicated implementation and test proof. Payment test routes must be preview-only.
- **Other (amplifi, settings):** content/publish workflow with authorization and tenant settings read-write/read-back must be verified separately.

**Certification decision:** Under the Amanda-style branch evidence boundary, 11 of 20 modules (Billing, Events, Member, Simplifi, Connect, Intake, Applications, Documents, Resources, Dashboard, Reports) are certified; 9 remain NO. Live payment/provider execution remains outside branch certification. Twenty have a shared durable selection receipt and executable isolated replay tests. No branch changes have been merged into production master.

## Batch 1: Commerce family (Billing, Events, Member)

- `lib/bricks/commerce-family.ts`: reusable order registration for Billing and Events, deterministic tenant/email/offer identity, one durable order, verified provider-payment contract, same-row `payment_status` and `payment_reference` update, tenant-scoped registration/payment tracking, confirmation retry, and idempotent member grant/revoke with confirmation receipt.
- `app/api/bricks/commerce-dollar-test/route.ts`: preview/test-only, authenticated fixture requiring `STRIPE_TEST_SECRET_KEY` beginning `sk_test_`; production GET/POST must return 404. **Synthetic $1 payment proof, not a Stripe charge.** No card or provider account is touched.
- `tests/commerce-family.test.mts`: Billing/Events fixture payment and order replay, conflicting payment rejection, tenant separation, tracking, confirmation escaping; Member grant/replay/revoke and durable failure.
- Billing and Events now accept an explicit `moduleConfigs.billing` or `moduleConfigs.events` offer/confirmation configuration through `installAdmittedModules` during a certified tenant install. Without offer configuration, the selection receipt remains available but registration/payment is intentionally unavailable. The isolated tests have not yet exercised a complete new-project manifest-to-payment chain. A real payment verifier must validate Stripe status, metadata, amount and currency before accepting a payment. Member grants are durable records but have not been synchronized to the production authorization provider. Concurrent exactly-once confirmation was not proven.
- [GitHub branch verification run 38136547999](https://github.com/TheArchitect1111/ea-payments/actions/runs/38136547999) **SUCCESS**: `npm test`, `npm run build`, production-mode GET/POST 404 probes (including commerce dollar test) passed. These validate simulated provider business logic, not live Stripe or provider entitlement updates.\n- **Certification decision: YES for Billing, Events, Member under the Amanda-style branch certification boundary.** Billing and Events use a controlled $1 verified-payment fixture, not a real Stripe charge. Member now writes the platform `member` entitlement on grant with tenant-matched read-back; per-person revocation preserves organization-wide module access. Package backfill preserves selected Member access.

## Required acceptance before YES

Each module needs a tenant-portable adapter or a clearly verified existing equivalent, durable business-record persistence, consistent-tenant readback, replay idempotency, functional write/list/update proof, tracking when applicable, and a Vercel-preview-only provisioning fixture returning GET/POST 404 in actual production. Payment modules require Stripe test-key isolation and same-row verified payment replay. Every new test must be executed; `npm test`, `npm run build`, and production-mode route probes must pass.

**Verification status:** New receipt logic has been pushed to a feature branch. The branch-only GitHub CI proof above passed; isolated receipts remain insufficient for full per-brick lifecycle certification. No live external provider, payment, or notification delivery has been executed. Tenant ACL, upload/download, and report job behavior have been exercised through isolated branch fixtures. Do not claim certification or merge this branch until these checks and module-specific provider flows pass. Existing production remains unchanged.

**Final Batch 1 CI:** [run 38136690979](https://github.com/TheArchitect1111/ea-payments/actions/runs/38136690979), SUCCESS after manifest configuration wiring: `npm test` PASS, `npm run build` PASS, GET/POST production 404 test route checks PASS. This is isolated software proof, **not** a live Stripe $1 payment or a proven membership-provider authorization update. Billing, Events and Member are **Certified YES under isolated Amanda-style branch tests**, not live Stripe/provider execution.

**Batch 1 final green proof:** [GitHub Actions run 38136990110](https://github.com/TheArchitect1111/ea-payments/actions/runs/38136990110): `npm test` PASS (including Member real-entitlement-writer fixture and selected backfill), `npm run build` PASS, GET/POST test-route 404 in production-mode build PASS. Live Stripe execution outside certification, same as Amanda `brick-amanda-certified`. A certification YES is branch-scoped and does not indicate merged production deployment.

## Batch 2 capture evidence

The shared `lib/bricks/capture-family.ts` adapter covers Simplifi capture/outcome routing, Connect relationship/follow-up, Intake durable submission/review, and Applications submission/review/confirmation handoff. Business IDs are deterministic and tenant-scoped, repeated submissions preserve the same row, changed replays are rejected, and the routed activity is recorded durably. `tests/capture-family.test.mts` exercises isolated lifecycle and tenant mismatch. `/api/bricks/capture-provision-test` runs only on preview with admin permission and returns 404 in production. **The adapter is now called by the existing Simplifi analyze POST, Connect relationships POST, and shared Intake/Applications submit and staff-review POST routes.** Accepted Applications with a configured Billing offer call `registerCommerce`; an explicitly supplied payment reference invokes the real `fulfillCommerceStripePayment` adapter, which retrieves and validates Stripe PaymentIntent metadata and settled amount before marking an order paid. No live charge was performed in branch certification. These four are **Certified YES under Amanda-style isolated branch certification**, with live external provider execution and production deployment outside scope.

**Batch 2 CI result:** [GitHub Actions run 38137336380](https://github.com/TheArchitect1111/ea-payments/actions/runs/38137336380) SUCCESS for latest code baseline: npm test PASS (all four executable replay/tenant/routing tests), npm run build PASS, GET/POST production 404 PASS for capture provisioning route and all prior guarded routes. That older run covered only isolated adapters. The subsequent verified integration run below exercised the actual customer-facing handlers and passed. No production merge performed.

**Batch 2 final customer-facing proof:** [GitHub Actions run 38138039266](https://github.com/TheArchitect1111/ea-payments/actions/runs/38138039266) **SUCCESS**: `npm test` (including `tests/capture-family.test.mts` and `tests/capture-customer-routes.test.mts`) PASS, `npm run build` PASS, and production-mode GET/POST 404 on `/api/bricks/capture-provision-test` PASS. Tenant isolation, duplicate suppression, one Connect welcome on replay, P/intake review persistence, P/applications Billing order registration and Stripe-verification handoff were exercised with isolated service fixtures. Amanda form and review paths remain untouched by the generic bridge. **Simplifi, Connect, Intake, Applications: CERTIFIED YES under branch fixture standard.** No actual provider sends or Stripe payments executed. No master merge.

## Batch 3: Content family (Documents, Resources, Dashboard, Reports)

**Certified YES under Amanda-style isolated branch evidence**, using [GitHub Actions run 38139611804](https://github.com/TheArchitect1111/ea-payments/actions/runs/38139611804) (SUCCESS).

- **Documents:** `P/documents` and non-Amanda `P/deliveries` show admitted tenant files and protected download links. Authenticated staff can upload PDFs, plain text, Markdown, PNG, or JPEG (maximum 120 KB). MIME and PDF/PNG/JPEG signatures are checked; bytes are saved in durable tenant-scoped content records and read back, never exposed by a public file URL. Member/staff ACL is enforced on the actual download route. Amanda's specialized Deliveries center is preserved unchanged.
- **Resources:** `P/resources` exposes uploaded tenant resource records and protected downloads alongside existing curated links. Staff manage resources via the same authorized upload API; member visibility is explicit. Replays with matching business identity preserve the original record; changed payloads fail closed.
- **Dashboard:** The existing `requirePortalModule` gate remains the first authorization step. The installed tenant-specific default is persisted and read back via `portalContentDefault`, with an authorized content API for tenant-customized display. Existing dashboard metrics, navigation and Amanda rendering are retained.
- **Reports:** `P/reports` provides an authorized generation action. `generateReport` reads the tenant's admitted Documents/Resources index, writes a deterministic JSON operational snapshot, moves the report's existing job row from queued to complete, and serves the generated artifact only through protected download with staff ACL. Repeated generation is idempotent; a changed source requires a distinct job key.

**Proof and safeguards:** `tests/content-family.test.mts` covers all four durable defaults, indexed read-back, tenant isolation, role ACL, replay/conflict, persistence failure and report generation. `tests/content-http-routes.test.mts` exercises the real Content upload/download/list/generation HTTP handlers with isolated durable-storage fixtures, including replay without extra writes, MIME denial, unauthorized member write denial and cross-tenant 404. `app/api/bricks/content-provision-test/route.ts` is an authenticated preview-only tenant provisioning fixture and explicitly verifies cross-tenant read rejection and the report artifact state. In the built production-mode server, **GET and POST of `/api/bricks/content-provision-test` both return 404**. The existing test routes' production 404 protections remain tested. `npm test` and `npm run build` PASS.

**Certification boundary:** This is software/fixture certification of the existing tenant persistence adapter, not a live Airtable storage audit or a deployed production release. Large-file/object storage and external report data pipelines are not included. The 120 KB in-record upload policy is intentional until external blob storage and its own security tests are separately qualified. Production `master` remains unchanged; the branch must pass the normal protected gate before any future promotion.
