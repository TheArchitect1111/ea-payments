# TB3 PayPal local verification — 2026-11-07

Branch `work/ayf-chassis-20261103`, base `03e6995e5a8a367e3b20ece9b6e777af7645b6ad`. Additive implementation; not committed, deployed, activated or production VERIFIED.

**Latest checkpoint:** safety hardening below supersedes the initial sandbox/confirmation/migration limitations. This run verified 20 distinct targeted tests (11 new, 9 affected existing), zero failures, zero scoped TypeScript diagnostics and clean scoped ESLint. Initial verification history is preserved below; the unchanged 55-test client suite was not repeated.

## Commit and sandbox preparation — 2026-11-07

Prepared `sandbox-acceptance.md` with one controlled session, an explicit nonproduction configuration checklist, catalog-only preflight before separate migration approval, sandbox-only payment authorization boundaries, evidence requirements and stop conditions. No database, secret access, accounts, deployment or external payment/fulfillment was used to prepare it.

One remaining offline review covered the exact 26-file PayPal allowlist: all files present, zero suspicious private-key/live-token patterns, protected existing Stripe/Printful/catalog files unchanged, and no pre-existing staged changes. Local PayPal enable flag was not enabled. Prior passing behavioral suites, TypeScript and lint were not repeated because implementation was unchanged. Staging is restricted to the reviewed allowlist; no AYF logs/evidence patches, generated test directories or environment files belong in the prepared commit. The Git index scope and whitespace are checked after staging. The actual commit requires separate approval; proposed subject is `feat(tb3): add isolated PayPal checkout and fulfillment safeguards`.

External sandbox acceptance remains NOT RUN. Next prerequisite is operator-approved sandbox configuration and isolated database identification, followed by the read-only preflight and separate migration/run approvals in the packet. Live checkout remains unchanged and unactivated.

## Safety hardening — latest local checkpoint

| Repair | Result | Verified behavior |
| --- | --- | --- |
| Sandbox Printful isolation | PASS | Service ignores the live quote port in sandbox, uses explicit fixture shipping/tax and records `simulated` fulfillment. Capture retries and webhook replay make zero Printful calls even with auto-approval requested. Actual runtime module is exercised with controlled dependencies; its quote entry point rejects sandbox before transport. Sandbox draft inspection also rejects before any request. |
| Sandbox ledger selection | PASS | Requires `TB3_PAYPAL_SANDBOX_DATABASE_URL`; no live fallback, rejects known matching live database identities. Operator must still verify direct/pooler aliases and actual nonproduction database ownership. |
| Fresh manufacturing authorization | PASS | Within the locked confirmation phase, re-fetches approved store, sync product/variants and draft. Checks catalog blank variant, store/order IDs, frozen items/recipient/shipping, current cost/currency, live approval/funding flags, cost ceiling and existing margin policy immediately before POST. Mutation/unavailability produces review without confirmation and preserves paid state. |
| Migration preflight | PASS locally | Catalog-only `BEGIN ... READ ONLY` / `ROLLBACK`, explicit database selection, bounded timeout, TLS verification, generic error output. Distinguishes absent name, compatible existing shape and incompatible relation/type collision; all existing-name cases block the create migration. Missing roles or incomplete inspection block. No customer rows read. |
| Migration collision guard | PASS source review; database execution NOT RUN | Plain `CREATE TABLE` aborts on a relation/type name collision before later permissions/RLS statements, including a collision after preflight. No `IF NOT EXISTS`, DML, account creation or references to other payment tables. No migration executed. |
| Existing safety invariants | PASS targeted | Duplicate capture/fulfillment prevention, lost response recovery, declined/pending payments, HTTP/webhook boundary, refund holds, partial/multiple captures, cancellation and SQL adapter rollback/tenant restrictions. |
| Scoped compilation/lint | PASS | `node scripts/tb3-paypal-typecheck.mjs` reports zero diagnostics; now includes preflight CLI. Scoped ESLint exits 0 with no warnings. |
| External acceptance/live activation | BLOCKED | No actual database inspection/migration, real sandbox transaction, SDK/browser merchant acceptance, webhook delivery or live Printful verification performed. No full build or release integration performed. |

Targeted commands and results:

```powershell
node --require ./tests/fixtures/network-offline.cjs --import tsx --test --test-name-pattern="sandbox|fresh draft|confirmation immediately|store/product|migration preflight|concurrent retries|lost Printful|refund hold|partial/multiple|pending payment cancellation" tests/tb3-paypal.test.mts
# 15 PASS / 0 FAIL
node --require ./tests/fixtures/network-offline.cjs --import tsx --test --test-name-pattern="actual sandbox runtime" tests/tb3-paypal.test.mts
# 1 PASS / 0 FAIL
node --require ./tests/fixtures/network-offline.cjs --import tsx --test --test-name-pattern="actual SQL ledger|lost capture|declined and pending|HTTP origin|refund hold|concurrent retries|lost Printful" tests/tb3-paypal.test.mts
# 7 PASS / 0 FAIL; 3 overlap earlier targeted run; filesystem escalation for esbuild only
node --require ./tests/fixtures/network-offline.cjs --import tsx --test --test-name-pattern="migration preflight" tests/tb3-paypal.test.mts
# 4 affected cases PASS after metadata null-array hardening; no new distinct cases
node scripts/tb3-paypal-typecheck.mjs
node node_modules/eslint/bin/eslint.js lib/tb3/paypal-*.ts app/tarris/paypal-checkout scripts/tb3-paypal-migration-preflight.mts scripts/tb3-paypal-typecheck.mjs tests/tb3-paypal.test.mts
```

The preflight CLI refusal test launches the CLI **without a database selection**, expects exit 1 and confirms sanitized output; it makes no connection. All database/provider tests use controlled mocks with the network-offline fixture. Actual PostgreSQL metadata query behavior and database constraints remain external acceptance requirements. A temporary four-diagnostic test typing issue from Next's augmented `ProcessEnv` was repaired by typing the pure configuration selector as a string/undefined record; final scoped compilation passes.

Changed in this hardening pass: new `lib/tb3/paypal-database-config.ts`, `paypal-fulfillment-safety.ts`, `paypal-migration-preflight.ts`, and `scripts/tb3-paypal-migration-preflight.mts`; updated PayPal service/runtime/ledger/types, isolated checkout page/receipt, migration, scoped typecheck tool, targeted tests and these specifications/evidence. Shared Printful/Stripe routes, transport, catalog/artwork and HQ were not edited. All pre-existing untracked files remain preserved. No secrets or generated logs added.

**Sandbox readiness:** implementation is ready for isolated acceptance configuration with simulated fulfillment; real external sandbox acceptance is not yet VERIFIED. Obtain an approved nonproduction database context and sandbox app/merchant/buyer/webhook/origin configuration through the authorized operator. Run the prepared read-only preflight before requesting separate migration approval. Sandbox needs no Printful credentials or funding. Keep live enablement off. Live blockers remain merchant/card verification, production preflight/migration and RLS/concurrency proof, tax policy, Printful catalog/funding/manufacturing approval, actual webhook/browser acceptance, final build/release gates and explicit activation approval. Existing refunded/manufactured orders still require an operator refund/cancellation procedure.

## Initial implementation verification (historical)

## Results

| Check | Result | Evidence/limits |
| --- | --- | --- |
| PayPal behavioral acceptance | PASS | 18 distinct tests in `tests/tb3-paypal.test.mts`; latest full PayPal run passed 17/17, then the added pending-cancellation case and 8 affected cases passed 9/9. No remaining failures. |
| Existing affected TB3 regressions | PASS | 55/55 across the five files below, run once alongside initial PayPal tests. Existing tests include both behavioral and source-contract coverage; new payment acceptance exercises runtime behavior. |
| Scoped TypeScript | PASS | `node scripts/tb3-paypal-typecheck.mjs`: zero diagnostics across actual new routes/UI dependencies and tests. Does not assert monorepo-wide compilation. |
| Scoped ESLint | PASS | Final source/UI/test/tooling lint exits 0, no warnings. |
| Protected existing files | PASS | `git diff --exit-code HEAD -- app/api/tb3/merch/checkout/route.ts app/api/webhooks/stripe-tb3-merch/route.ts public/tb3 lib/tb3/merch-cart.ts lib/tb3/printful-client.ts lib/tb3/printful-transport.ts lib/tb3/fulfillment-approval.ts`: exit 0. No tracked pre-existing file changed. |
| Production database/RLS execution | BLOCKED | SQL migration not applied; adapter transaction/TLS/tenant/rollback behavior tested with mocked pg, service concurrency with a serialized transactional ledger. Actual PostgreSQL enforcement/concurrency remains unverified. |
| Merchant credentials/card underwriting/webhook delivery | BLOCKED | No credential access or external payment calls performed. SDK eligibility tested with a controlled mock, not a real merchant/browser account. |
| Retail tax coverage | BLOCKED | Merchant-reviewed policy required. Only explicitly reviewed no-collection states are supported; other destinations are rejected. |
| Live Printful funding/manufacturing | BLOCKED | Controlled transport mocks only. Existing funding, draft approval and cost gates remain required. |
| Full native build/production release | BLOCKED / NOT RUN | No new full build or deployment attempted. Prior production-based release integration and full release gates remain separate prerequisites. |

Aggregate distinct local tests: **73 PASS (18 new + 55 existing), 0 unresolved FAIL**. Passing unchanged suites were not rerun after PayPal-only repairs. No real payments, customer records, outbound emails or Printful orders were created. Network-offline fixture applied to tests.

## Commands and actual execution history

Initial consolidated command:

```powershell
node --require ./tests/fixtures/network-offline.cjs --import tsx --test tests/tb3-paypal.test.mts tests/tb3-printful-cart.test.mts tests/tb3-printful-transport.test.mts tests/tb3-fulfillment-approval.test.mts tests/tb3-merch-checkout-contract.test.mts tests/tb3-commerce-sandbox.test.mts
```

Initial result: 63 PASS / 1 FAIL, comprising 55 existing PASS plus 8 new PASS and a new concurrency failure. The repair prevents a second status request from changing an in-flight Printful confirmation into review. The expanded new suite subsequently found and repaired misleading treatment of a previously completed but now reversed capture. Strict compilation also caught nullable provider responses, fixed with explicit rejection. No existing behavior or assertions were weakened.

New tests were then expanded to 17 and passed 17/17:

```powershell
node --require ./tests/fixtures/network-offline.cjs --import tsx --test tests/tb3-paypal.test.mts
```

This command required filesystem-sandbox escalation for esbuild to resolve the actual ledger module. The first sandbox attempt failed with filesystem access denial; the same ledger test passed outside the sandbox with network blocking retained. This was not a provider/SQL failure. The SQL adapter test executes bundled production adapter code against a mock Client and verifies commit, rollback, restricted TLS, lock key and tenant-bound query parameters.

After adding the eighteenth test and fixing pending-payment cancellation, only affected cases were rerun:

```powershell
node --require ./tests/fixtures/network-offline.cjs --import tsx --test --test-name-pattern="cancel|concurrent|capture|lost|HTTP" tests/tb3-paypal.test.mts
node scripts/tb3-paypal-typecheck.mjs
node node_modules/eslint/bin/eslint.js lib/tb3/paypal-*.ts app/api/tb3/paypal app/tarris/paypal-checkout tests/tb3-paypal.test.mts scripts/tb3-paypal-typecheck.mjs
```

Results: affected behavioral tests 9/9 PASS; TypeScript 0 diagnostics; ESLint exit 0. Earlier lint issues (ref rendering, untyped test JSON, CJS tooling and reserved test variable name) were repaired. No rule or existing test was globally disabled; the heterogeneous provider JSON type has one documented local typing exception, with security-relevant values explicitly runtime-validated.

## Demonstrated controlled workflow

Canonical Printful catalog variant + quantity + fixture delivery address → committed checkout intent → official Orders create payload with pinned merchant, USD item/shipping/tax breakdown and stable request ID → independently fetched APPROVED order → capture → independently fetched COMPLETED order plus capture details → durable paid record → deterministic Printful external ID → one draft → approved, funded, bounded-cost confirmation. Concurrent requests and repeated webhooks produce one capture, one draft and one confirmation. Lost capture and Printful responses reconcile provider identities without a second charge or manufacturing request.

Negative coverage: browser price/tenant injection, unknown variants, quantity overflow, changed checkout identity, wrong owner token, tenant mismatch, expired intent, unavailable ledger, merchant/currency/amount/address mismatch, declined/pending/reversed/partial/multiple captures, unsafe webhook certificate URLs, missing/failed signatures, forged HTTP origins, oversized bodies, rate limits and changed Printful recipient. Pending cancellation never claims that no payment exists; held records cannot be reopened through cancellation.

The isolated page renders only SDK-eligible PayPal/card buttons, freezes the submitted cart/address, shows verified outcomes, retains only the opaque token/order ID in tab session storage for status recovery, and never stores card details or credentials. Browser checkout and real SDK operation remain activation verification work, not a claimed end-to-end success.

## Files added

- `lib/tb3/paypal-{config,http,ledger,routes,runtime,service,transport,types}.ts`
- `app/api/tb3/paypal/{config,orders,capture,cancel,webhook}/route.ts`
- `app/tarris/paypal-checkout/{page,PayPalCheckout}.tsx`
- `scripts/sql/tb3-paypal-ledger.sql` (not applied)
- `scripts/tb3-paypal-typecheck.mjs`
- `tests/tb3-paypal.test.mts`
- `specs/tb3-paypal/{spec,activation,evidence}.md`

Pre-existing untracked AYF logs/evidence/test directories were preserved and are outside this change. No environment files, credentials or generated test logs were added. See `activation.md` for exact configuration names and required next actions.
