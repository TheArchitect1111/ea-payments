# Chassis admitted-selection persistence fix

Baseline: master `7a8c4f0dfaa110740441b7223061458f08825e6d`, after the Amanda certified merge. Delivery branch: `fix/chassis-autowire`. No merge or production write is authorized or performed.

## Result

**YES: the certified factory now writes the actual admitted selection to entitlements and the tenant installation record.** Explicit module IDs, business-option IDs, industry-pack suggestions and portable-brick dependencies all use the same preflight. Durable read-back is required. Subsequent package backfill uses the saved selection, including later selector enable/disable changes, instead of silently replacing it with package defaults.

This fixes selection persistence and installs the portable enrollment API. It does not certify all modules or implement the generic academy LMS promised by earlier metadata. Calendar, People and Discovery remain blocked; explicitly selecting packs/bundles requiring them returns rejection rather than a false success.

## Before and after

| Stage | Before | After |
|---|---|---|
| Select | Module request, business-option list and pack configuration used different paths | New project manifest accepts requestedModuleIds, businessOptionIds, industryPackId and bricks |
| Resolve | Preflight used package name; writer could use commerce-offer key | Preflight and fallback share resolveEntitlementPackageKey; explicit offer takes precedence |
| Admit | Factory checked extra requested IDs | Modules, bundles, pack suggestions and brick dependencies enter one requireAssemblyPlan |
| Write | Writer recomputed defaults and discarded requested IDs | Foundation passes assemblyPlan.admitted as admittedModuleIds |
| Install | Evidence could describe a selection that was never persisted | Durable tenant journal records the same admitted IDs; configured brick installers execute |
| Verify | Null/partial writes could still return success | Exact package-entitlement set and install journal are read back; missing persistence fails |
| Backfill | Package/login sync could erase custom package selection | Existing install journal remains authoritative |
| Modify selector | Admin enable bypassed certification | Single, bundle and bulk enables require certified admission; successful changes update existing installation selection |
| Disable | Core modules could be suspended; backfill could restore a removed addon | Standard chassis modules reject disable; installed addon disable is retained across backfill |
| Mark ready | Evidence alone could imply successful installation | State remains installing until entitlement verification, brick installation and durable evidence succeed |

## Authoritative paths

- `lib/modules/client-factory-assembly.ts`: manifest expansion and common admission.
- `lib/tenant-foundation.ts`: preflight before organization/entitlement writes; exact admitted-list handoff and brick installation.
- `lib/modules/ensure-package-entitlements.ts`: explicit/installed list instead of recomputed defaults; exact read-back.
- `lib/modules/tenant-install.ts`: tenant-scoped durable installing/installed journal.
- `lib/fulfill-paid-client.ts`: explicit selections enter certified foundation and propagate failure; unselected legacy callers remain compatible.
- `app/api/admin/entitlements/route.ts`: certified single/bundle/bulk enable and retained installed selection.
- `app/api/admin/chassis/install/route.ts`: authenticated admin manifest catalog and installation endpoint.
- `config/chassis-manifests/amanda-enrollment.example.json`: executable manifest shape for a new tenant.

Industry packs were previously selected through explicit/inferred paid-client configuration and `resolve-pack-for-org`; there was no existing admin industry-pack install API. The new manifest API makes that selection explicit. Unknown packs and the sample placeholder fail closed. A pack's suggested modules now participate in admission, not just navigation.

## Portable Amanda adapter

`lib/portal-universal/bricks/amanda/` is a composite service over the existing certified member, training, billing, intake, applications, reports, messaging and settings modules. It does not introduce invented ModuleId entitlements or copy fixed Amanda tenant IDs.

| Contract | Implemented behavior |
|---|---|
| Install entry | `PORTABLE_BRICK_REGISTRY.amanda`; manifest selects `bricks: [{id: "amanda", config: ...}]` |
| Configuration | Tenant brand, offers/prices/currencies and confirmation templates validated before any install write |
| Persistence | Persisted Airtable organization required; independent durable read-back, no memory success |
| Signup | Tenant/email/offer deterministic registration ID; canonical unpaid status/reference; durable signup tracking event |
| Checkout | Authenticated installed tenant API creates Stripe Checkout with server-derived price and correlated metadata |
| Payment | Existing signed Stripe webhook dispatches only sessions marked portableBrick=amanda; provider API re-fetch validates paid status, tenant, registration, offer, amount and currency |
| Same record | Payment updates enrollment-<registration_id>; signup replay preserves paid state; conflicting references rejected |
| Tracking | Tenant-scoped durable signup/payment event records. Existing Amanda tracking ingest is not reused across tenants |
| Confirmation | Tenant template rendered with escaped customer values, sent through existing email service; sequential replay preserves confirmationSent |
| Access boundary | Authenticated session slug, persisted org, explicit role, active membership, installed brick and active dependency entitlements required; actor can access only their own registration |
| Disable | Suspended required dependency makes adapter unavailable; unfinished installations return 404 |
| Source evidence | `config/portable-brick-evidence.json` uses the existing ten evidence-class names and exact source hashes; certified module dependencies are checked by `scripts/check-chassis-autowire-evidence.mjs` |

The adapter API is `/api/portal/[slug]/bricks/amanda`. It supports signup, checkout and payment verification. The existing signed `/api/webhooks/stripe` callback handles automatic payment fulfillment. It is a protected enrollment service, not a newly designed public storefront or complete generic learning/certificate platform.

The new evidence status is **branch-verified**, scoped to isolated API integration. Existing module certificates supply the shared UI boundary; no new visual or live-payment certification is asserted. Its ten-class descriptor does not inflate the existing count of 20 certified technical modules.

## Automated proof

- `npm test`: existing Amanda dollar suite plus new chassis-autowire integration suite.
- New integration tests exercise actual selection resolver, foundation, exact writer, install record, adapter and API handlers with isolated provider/database ports.
- Coverage: exact admitted-versus-written set, deduplication, offer precedence, business-option expansion, positive pack install, blocked pack/unknown ID rejection before writes, nondurable/dropped write failure, package backfill, retained selector enable/disable, tenant isolation, authentication/membership/origin denial, signup/checkout, provider correlation, same-record payment/replay/conflict, confirmation and tracking records.
- `npm run build` checks the production artifact; relevant assembly/security/certification gates are also run.
- Repository-wide TypeScript is compared with an untouched baseline because master already contains errors; no unrelated baseline repairs are included.
- `.github/workflows/chassis-autowire.yml` runs tests, exact-source evidence verification, assembly gates and build on this branch and PRs to master.

## Amanda production protection

No changes to existing `lib/amanda-catherine`, `app/amanda-catherine`, `app/api/amanda-catherine` or `app/portal/amanda-catherine` files. The shared Stripe webhook adds only a metadata-specific portable dispatcher; existing sessions take the original path. Existing Amanda tests pass.

Read-only production check: `https://ea-payments.vercel.app/amanda-catherine` returned HTTP 200. Production `/api/amanda-catherine/preview-dollar-test` returned HTTP 404. No payments, registrations, env reads, entitlement writes or installation were performed against production.

## Limits and rollback

- Existing unselected legacy callers retain compatibility; a legacy override cannot bypass certification for an explicit new selection.
- External tenant tracking ingest, a public storefront, generic course-access/progress/certificate provisioning, and a portable preview-dollar route are not claimed by this change.
- Airtable writes across tables are not transactional. Failed installs remain incomplete and can be retried; partial writes are not reported as installed.
- Tests prove sequential callback idempotence. Simultaneous callback/email delivery and distributed write races require separate locking/outbox work before claiming exactly-once delivery.
- Current production remains on master. Rollback is to discard/revert the isolated branch. Production deployment and production certification require a later approved merge/deploy.

## Recorded validation results

| Check | Result |
|---|---|
| npm test | PASS: 5 existing Amanda tests + 15 chassis integration tests |
| Exact-source evidence and 8 certified dependencies | PASS |
| Production artifact build | PASS |
| Assembly Runs 2, 3, 4, 5, 6 | PASS |
| Production protection, tenant release safety, release guardrails, system registry, capability standard | PASS |
| Lego certification schema/contract/factory lock/wave/strict authority/final acceptance | PASS |
| Focused ESLint and git diff whitespace check | PASS |
| Repository-wide TypeScript | Baseline already fails; normalized comparison found zero introduced diagnostics |
| Existing Amanda source namespaces | No changed files |
| Existing Amanda production URL | Read-only HTTP 200 |
| Existing production preview-dollar-test guard | Read-only HTTP 404 |

Provider/database interactions in the new tests are isolated fixtures, not production writes or real charges.
