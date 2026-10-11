# Remaining chassis bricks: audit and certification status

**Branch:** `fix/remaining-bricks-certified` (not merged into master). **Production baseline:** `0b91edac` (certified source `bf5f5987`).

## Inventory discrepancy

Requested `docs/BRICKS_AUDIT.md` does not exist on the inspected production ref. The canonical `lib/modules/registry.ts` contains **23 module IDs**. The dedicated certified module installers are `calendar`, `people`, `discovery`. This leaves **20**, not 19, registry modules needing separate lifecycle certification. Amanda is a portable **client adapter**, not one of those 23 registry module IDs. We cannot subtract Amanda from the 20 and silently omit a real module.

## What this branch implements

`lib/bricks/module-install.ts` now persists durable tenant-scoped module-selection installation receipts for all non-dedicated selected modules. Existing records are replayed without rewriting, and a module/version mismatch fails closed. It uses the existing tenant validation and Airtable read-back persistence. The dedicated Calendar, People and Discovery installers remain unchanged. **This is shared receipt-level wiring, not proof of 100% functional autowire.** The receipt must not be interpreted as evidence of payment, signup, notifications, or other functional lifecycle readiness.

| Brick | Certified YES/NO | Has Installer | Has Replay Protection | Has Provisioning Test | 404 in Prod | Autowires |
|---|---|---|---|---|---|---|
| dashboard | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| pulse | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| simplifi | NO | Shared durable capture adapter | Yes, business identity and route | Isolated E2E fixture + preview provision route | YES (CI) | Business adapter available; existing UI/API handoff not yet verified |
| amplifi | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| connect | NO | Shared durable capture adapter | Yes, business identity and route | Isolated E2E fixture + preview provision route | YES (CI) | Business adapter available; existing UI/API handoff not yet verified |
| update-hub | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| training | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| landing | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| documents | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| messaging | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| events | YES | Portable shared installer + business lifecycle | YES (same-row / member request ID) | YES (fixture, replay, tenant, backfill) | YES (CI) | YES, manifest selection; Billing/Events configured via moduleConfigs |
| resources | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| ask | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| billing | YES | Portable shared installer + business lifecycle | YES (same-row / member request ID) | YES (fixture, replay, tenant, backfill) | YES (CI) | YES, manifest selection; Billing/Events configured via moduleConfigs |
| settings | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| ctp | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| member | YES | Portable shared installer + business lifecycle | YES (same-row / member request ID) | YES (fixture, replay, tenant, backfill) | YES (CI) | YES, manifest selection; Billing/Events configured via moduleConfigs |
| intake | NO | Shared durable capture adapter | Yes, business identity and route | Isolated E2E fixture + preview provision route | YES (CI) | Business adapter available; existing UI/API handoff not yet verified |
| applications | NO | Shared durable capture adapter | Yes, business identity and route | Isolated E2E fixture + preview provision route | YES (CI) | Business adapter available; existing UI/API handoff not yet verified |
| reports | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |

## Executed branch acceptance proof

- [GitHub Actions run 38136272668](https://github.com/TheArchitect1111/ea-payments/actions/runs/38136272668) finished **SUCCESS** on the branch after adding executable receipt replay tests.
- `npm test` **PASS**: existing Amanda, chassis and Calendar/People/Discovery tests plus 22 inventory/wiring assertions and 20 executable per-module tenant-partition/replay/durable-write-failure tests.
- `npm run build` **PASS**.
- Production-mode built-server checks **PASS**: both GET and POST return **404** for `/api/bricks/tenant-provision-test`, `/api/calendar/tenant-provision-test`, `/api/people/tenant-provision-test`, `/api/assessment/tenant-provision-test`.
- New shared test route supports all 20 module IDs on preview, checks admission and saved install receipts, and explicitly declares `lifecycleCertified:false`. The integration suite does **not** use authenticated remote Airtable or Stripe sessions.

## Individual functional acceptance gaps

- **Capture (simplifi, connect, intake, applications):** domain-specific capture records, stable business identity, same-row update and tracking with replay tests still need actual writes/read-back against the intended provider.
- **Requests (ask/Guide, messaging, update-hub):** request submission, delivery, conversation response and feed freshness/authorization must be wired and executed, not just installed.
- **Content (dashboard, pulse, documents, resources, reports):** persisted tenant defaults, storage ACL, generated artifact/job state, and authorized read-back require domain integration tests.
- **Commerce/journey (billing, events, member, ctp, training, landing):** registration/enrollment, Stripe test-credential isolation, webhook and payment replay, confirmation, publish/forms and provider readiness still require dedicated implementation and test proof. Payment test routes must be preview-only.
- **Other (amplifi, settings):** content/publish workflow with authorization and tenant settings read-write/read-back must be verified separately.

**Certification decision:** Under the Amanda-style branch evidence boundary, 3 of 20 modules (Billing, Events, Member) are certified; 17 remain NO. Live payment/provider execution remains outside branch certification. Twenty have a shared durable selection receipt and executable isolated replay tests. No branch changes have been merged into production master.

## Batch 1: Commerce family (Billing, Events, Member)

- `lib/bricks/commerce-family.ts`: reusable order registration for Billing and Events, deterministic tenant/email/offer identity, one durable order, verified provider-payment contract, same-row `payment_status` and `payment_reference` update, tenant-scoped registration/payment tracking, confirmation retry, and idempotent member grant/revoke with confirmation receipt.
- `app/api/bricks/commerce-dollar-test/route.ts`: preview/test-only, authenticated fixture requiring `STRIPE_TEST_SECRET_KEY` beginning `sk_test_`; production GET/POST must return 404. **Synthetic $1 payment proof, not a Stripe charge.** No card or provider account is touched.
- `tests/commerce-family.test.mts`: Billing/Events fixture payment and order replay, conflicting payment rejection, tenant separation, tracking, confirmation escaping; Member grant/replay/revoke and durable failure.
- Billing and Events now accept an explicit `moduleConfigs.billing` or `moduleConfigs.events` offer/confirmation configuration through `installAdmittedModules` during a certified tenant install. Without offer configuration, the selection receipt remains available but registration/payment is intentionally unavailable. The isolated tests have not yet exercised a complete new-project manifest-to-payment chain. A real payment verifier must validate Stripe status, metadata, amount and currency before accepting a payment. Member grants are durable records but have not been synchronized to the production authorization provider. Concurrent exactly-once confirmation was not proven.
- [GitHub branch verification run 38136547999](https://github.com/TheArchitect1111/ea-payments/actions/runs/38136547999) **SUCCESS**: `npm test`, `npm run build`, production-mode GET/POST 404 probes (including commerce dollar test) passed. These validate simulated provider business logic, not live Stripe or provider entitlement updates.\n- **Certification decision: YES for Billing, Events, Member under the Amanda-style branch certification boundary.** Billing and Events use a controlled $1 verified-payment fixture, not a real Stripe charge. Member now writes the platform `member` entitlement on grant with tenant-matched read-back; per-person revocation preserves organization-wide module access. Package backfill preserves selected Member access.

## Required acceptance before YES

Each module needs a tenant-portable adapter or a clearly verified existing equivalent, durable business-record persistence, consistent-tenant readback, replay idempotency, functional write/list/update proof, tracking when applicable, and a Vercel-preview-only provisioning fixture returning GET/POST 404 in actual production. Payment modules require Stripe test-key isolation and same-row verified payment replay. Every new test must be executed; `npm test`, `npm run build`, and production-mode route probes must pass.

**Verification status:** New receipt logic has been pushed to a feature branch. The branch-only GitHub CI proof above passed; isolated receipts remain insufficient for full per-brick lifecycle certification. No real end-to-end provider, payment, capture, notification, ACL, or job-generation proof has been executed. Do not claim certification or merge this branch until these checks and module-specific provider flows pass. Existing production remains unchanged.

**Final Batch 1 CI:** [run 38136690979](https://github.com/TheArchitect1111/ea-payments/actions/runs/38136690979), SUCCESS after manifest configuration wiring: `npm test` PASS, `npm run build` PASS, GET/POST production 404 test route checks PASS. This is isolated software proof, **not** a live Stripe $1 payment or a proven membership-provider authorization update. Billing, Events and Member are **Certified YES under isolated Amanda-style branch tests**, not live Stripe/provider execution.

**Batch 1 final green proof:** [GitHub Actions run 38136990110](https://github.com/TheArchitect1111/ea-payments/actions/runs/38136990110): `npm test` PASS (including Member real-entitlement-writer fixture and selected backfill), `npm run build` PASS, GET/POST test-route 404 in production-mode build PASS. Live Stripe execution outside certification, same as Amanda `brick-amanda-certified`. A certification YES is branch-scoped and does not indicate merged production deployment.

## Batch 2 capture evidence

The shared `lib/bricks/capture-family.ts` adapter covers Simplifi capture/outcome routing, Connect relationship/follow-up, Intake durable submission/review, and Applications submission/review/confirmation handoff. Business IDs are deterministic and tenant-scoped, repeated submissions preserve the same row, changed replays are rejected, and the routed activity is recorded durably. `tests/capture-family.test.mts` exercises isolated lifecycle and tenant mismatch. `/api/bricks/capture-provision-test` runs only on preview with admin permission and returns 404 in production. **The adapter has not yet been connected to the existing Simplifi, Connect, P/intake and P/applications/P/apply UI handlers.** The Applications commerce handoff is an outcome state only, not a verified checkout initiation. Therefore all four retain **Certified NO** pending actual UI flow and provider-backed integrations.

**Batch 2 CI result:** [GitHub Actions run 38137336380](https://github.com/TheArchitect1111/ea-payments/actions/runs/38137336380) SUCCESS for latest code baseline: npm test PASS (all four executable replay/tenant/routing tests), npm run build PASS, GET/POST production 404 PASS for capture provisioning route and all prior guarded routes. The four capture families remain **Certified NO** until their existing customer-facing entry points (Simplifi capture, Connect relationships, P/intake, P/applications/P/apply) use the durable canonical adapter and provider-backed end-to-end workflows pass. No production merge performed.
