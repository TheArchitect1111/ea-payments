# TB3 Commerce Catalog Convergence

**Request:** Use one canonical Printful catalog across the TB3 storefront, PayPal checkout, and private HQ; restore exact local art where available; block unverified fulfillment mappings.
**Project/tenant:** TB3 / tarris
**Owner:** TB3 project owner
**Status:** Local implementation complete; live Printful verification remains external

## Intent

The public storefront, checkout resolver, and HQ merchandise report use one canonical 14-product / 82-variant catalog. Existing Printful IDs, variant IDs, catalog variant IDs, names, prices, sizes, and exact artwork references are preserved from an existing source ref. No provider identifiers or SKUs are synthesized. All products stay Coming Soon and fulfillment-unverified until a read-only live catalog check is completed.

## Scope

### In scope
- [x] Converge the storefront and checkout catalogs on the existing 14-product / 82-variant Printful mapping.
- [x] Reuse exact mockup files already present in the preserved TB3 Printful asset ref.
- [x] Share canonical product/variant metadata with HQ order reporting.
- [x] Fail closed for any product without explicit fulfillment mapping verification.
- [x] Run focused catalog, browser, and integration regression checks.

### Out of scope
- Production data/configuration, deployments, credential access, real PayPal payments, Printful order or product mutations, and checkout activation.

## Source of truth

- Authoritative client: clients/tb3/client.json (TB3 / tarris).
- Existing checkout mapping: lib/tb3/printful-manifest.json at the pre-repair branch HEAD; removed after exact reconciliation into the canonical manifest.
- Preserved exact manifest and mockup source: origin/assets/tb3-printful-20261024 at 04c0f1f316b2ae4137c07d145203e235113933cf; its 14 product IDs and 82 variant mappings were compared against the current checkout manifest and matched exactly.
- Canonical source after repair: public/tb3/merch/manifest.json, imported through lib/tb3/merch-catalog.ts.
- App safeguards: lib/tb3/paypal-config.ts, lib/tb3/paypal-runtime.ts, and lib/tb3/paypal-service.ts.
- Governance: .specify/memory/constitution.md, SECURITY-MODEL.md, and the existing TB3 commerce spec.

## Protected invariants

- Public merchandise stays Coming Soon; PayPal checkout stays disabled.
- Printful remains the sole merchandise fulfillment provider; Printful ordering remains disabled.
- No IDs, SKUs, catalog availability, shipping rates, or funding state are invented.
- Products without an explicitly verified mapping cannot be purchased.
- Existing PayPal idempotency, webhook verification, tenant authorization, ledger controls, and private HQ behavior remain intact.
- No production or database changes; no unrelated clients, Stripe contractual deposits, or AYF work changes.

## Acceptance criteria

1. Storefront, checkout, booking inquiry, and HQ reporting reference one canonical product catalog.
2. All 14 existing product records and 82 variant mappings retain their exact pre-repair Printful IDs, prices, currency, and sizes.
3. No Printful SKU is added unless present in an authoritative source; the current absence is represented without synthetic values.
4. Every mockup URL resolves to an existing verified asset where the preserved source ref contains the referenced asset.
5. Products remain Coming Soon and the checkout cart resolver rejects products without explicit mapping verification.
6. HQ reporting resolves order item display names/sizes from the canonical catalog when provider IDs match and safely retains historical snapshots when they do not.
7. Focused catalog, browser, checkout safety, HQ integration, and affected regression tests pass.
8. No production deployment, database/provider request, credential access, charge, Printful draft, or fulfillment submission occurs.

## Verification plan

- Compare canonical manifest IDs, variants, price, size, and assets against the pre-repair mapping and preserved asset ref.
- Run catalog/HQ and focused PayPal regression tests with in-memory fixtures.
- Run the TB3 Playwright browser suite for Coming Soon, all 14 product cards/artworks, checkout unavailability, and HQ rendering/access protections.
- Run focused TypeScript/build checks where the isolated worktree permits.
- Audit the final diff and commit only TB3 catalog, test, artwork, and spec files.

## Rollback condition

Any changed product/variant ID, price or size, missing/broken asset, visible active checkout, reachable payment runtime while disabled, Printful mutation, auth/tenant regression, or unrelated file change blocks the commit.

## Completion evidence

Focused evidence: catalog/HQ/PayPal integration suite 38/38 passed, including isolated SQL ledger adapter and fail-closed CLI checks; full TB3 Phase 2 Playwright suite 20/20 passed across desktop and mobile, followed by 4/4 affected catalog/checkout checks after the final UI repair; TB3 Phase 1 contract passed; scoped TypeScript diagnostics 0 (17 unrelated repository diagnostics excluded). Live Printful store identity, product/variant/SKU availability, artwork placements, pricing, shipping, and fulfillment funding remain external verification requirements.

## Preview-only diagnostic authorization addendum (2026-11-09)

The read-only Printful connectivity endpoint may accept either its existing Tarris HQ viewer/admin authorization or a separate high-entropy diagnostic token. The token is supplied only in the `x-tb3-printful-diagnostic-token` request header. Preview stores only its SHA-256 verifier as `TB3_PRINTFUL_DIAGNOSTIC_TOKEN_SHA256`; the raw token is never stored in source, returned, or logged. Token verification uses constant-time digest comparison and rejects malformed or missing verifiers.

The alternate credential is valid only when both `VERCEL_ENV=preview` and `VERCEL_GIT_COMMIT_REF=work/tb3-commerce-hq-20261109`. The check precedes credential handling. It is confined to `/api/tb3/printful/diagnostic`; all other HQ routes retain their existing authorization. It does not bypass Vercel Deployment Protection. An invalid supplied token fails closed before key-presence checks or provider access. The endpoint remains one read-only catalog GET and cannot create or update Printful resources.

Acceptance: valid test token permits this Preview diagnostic without HQ login; absent token preserves normal HQ authorization; wrong, malformed, or unconfigured tokens are denied without reading Printful configuration; Production, other Preview branches, and all other routes reject the test credential; the response contains no credential, provider payload, or error detail. Rollback: remove the Preview-only verifier configuration and revert the diagnostic authorization change. Checkout, PayPal live-payment, and Printful-order safeguards remain unchanged.

## Preview-only Sandbox ledger isolation diagnostic (2026-11-10)

The one-time `/api/tb3/paypal/ledger-diagnostic` route is available only on Preview branch `work/tb3-commerce-hq-20261109`, requires a dedicated high-entropy token verifier scoped to that route, and returns only PASS/FAIL booleans. It reads only `TB3_PAYPAL_SANDBOX_DATABASE_URL`; it never falls back to production database variables. Before connecting, it requires the embedded Supabase project reference to equal `jkoasrnjlehjziynxfrn` and rejects `dwygvwnjjaennksddniu`, other projects, invalid TLS settings, or any database role outside the restricted merchant role. The connection uses TLS certificate validation.

The handler runs a read-only transaction and queries PostgreSQL catalogs only. It verifies the ledger table, required columns, primary and provider uniqueness, enabled and forced RLS, the single `tarris` tenant policy for `ea_merchant_api`, and absence of table grants to PUBLIC, `anon`, `authenticated`, and `service_role`; the merchant role may select, insert, and update but may not delete, truncate, trigger, or grant references. It returns no database host, role, connection detail, catalog row, or provider data. It refuses to run when PayPal checkout or Printful fulfillment approval is enabled; it has no PayPal or Printful provider imports.

Acceptance: wrong branch, Production, missing/invalid token, missing database URL, non-Sandbox project, or enabled payment/fulfillment gates fail before database access; a connected database reports PASS only if every schema, RLS, and least-privilege check passes. Tests assert read-only transaction use and no ledger row access. Rollback: remove the dedicated Preview verifier, revert the diagnostic route and handler, and remove only the diagnostic deployment after evidence is recorded. No checkout, capture, Production setting, or Printful ordering state changes.

## Preview-only synthetic Sandbox checkout preparation (2026-11-11)

The dedicated `/tarris/sandbox-certification` page and synthetic cart path are permitted only when all of the following are true: `VERCEL_ENV=preview`, `VERCEL_GIT_COMMIT_REF=work/tb3-commerce-hq-20261109`, `TB3_PAYPAL_ENV=sandbox`, `TB3_PAYPAL_ENABLED=true`, `TB3_PAYPAL_SANDBOX_TEST_ITEM_ENABLED=true`, and the configured Sandbox database URL resolves to project `jkoasrnjlehjziynxfrn`. Both Printful approval flags must remain false or unset. Both checkout flags remain false or unset until a separate approval.

The test cart accepts exactly one quantity of the fixed synthetic variant `99000001`, priced at USD 0.01. It uses no Printful product ID, catalog variant ID, SKU, or live merchandise record; the test ledger line is labeled non-fulfillable. Sandbox shipping remains the existing fixed USD 5.00 fixture. The existing PayPal Sandbox APIs, restricted `tarris` ledger role, capture/idempotency handling, webhook verification, and HQ reporting are reused. Sandbox runtime fulfillment is simulated and cannot call Printful. The test page is unlinked, no-indexed, and hidden unless the exact Preview/Sandbox gates pass. Page and checkout API access accepts either existing Tarris viewer-or-higher HQ authorization or the isolated Preview test session described below; neither grants access to other HQ routes. The ordinary merchandise checkout page remains unavailable in synthetic test mode; the public Coming Soon storefront and all 14 products remain untouched.

### Temporary Preview test authorization

For the controlled Sandbox run, `TB3_PAYPAL_SANDBOX_TEST_TOKEN_SHA256` may be configured only for Preview branch `work/tb3-commerce-hq-20261109`. A high-entropy token has the form `tb3sbx.<expires-unix-seconds>.<32-byte-base64url-random>` and is valid for at most two hours. Only its SHA-256 verifier is stored in Vercel. The dedicated session exchange route requires same-origin requests and permits at most five attempts per hour. On success it exchanges the token for a `Secure; HttpOnly; SameSite=Strict` cookie capped at 15 minutes; the token is neither logged nor returned. The test session is checked before HQ authorization and grants access only to the synthetic Sandbox page and PayPal config/create/capture/cancel handlers. It has no membership lookup or customer-record/report access; webhook requests remain protected by PayPal signature verification. Cookie deletion and expiry are supported. The alternate session is inert unless the exact Preview/Sandbox/database and Printful-disabled gates pass.

Acceptance: Production, wrong Preview branch, live PayPal mode, incorrect/missing Sandbox project identity, missing feature flags, or either Printful approval flag fail closed; cart variations, real catalog variants, mixed carts, and quantity greater than one are rejected in test mode; order creation/capture persists only to the verified Sandbox ledger; retries/webhooks retain existing idempotency; no Printful request, draft, or confirmation can occur. Rollback: remove the synthetic item resolver and hidden test page, then leave both Preview checkout flags disabled. No deployment, flag activation, database migration, or PayPal transaction is included in this preparation.

## Preview-only no-payee PayPal order diagnostic (2026-11-11)

`POST /api/tb3/paypal/sandbox-payee-diagnostic` is a temporary diagnostic available only when `VERCEL_ENV=preview`, the exact TB3 commerce branch is selected, the existing synthetic Sandbox runtime is active, and the request passes the existing same-origin plus temporary Sandbox-session/HQ authorization. The route is not available in Production, other Preview branches, or outside the existing Sandbox test-item gates; it is rate limited to one request per hour.

The diagnostic uses the existing server-side Sandbox transport and credentials to create one $5.01 `CAPTURE`-intent order using the fixed $0.01 synthetic item and $5.00 fixture shipping. Its sole purchase unit deliberately omits `payee`. A stable daily request ID makes retries idempotent. It performs no approval, capture, webhook reconciliation, ledger write, or Printful request. If PayPal omits the merchant identity from creation response, the diagnostic may make a read-only order GET to inspect the returned identity. The response is allow-listed to sanitized order state, amount/fixture checks, capture state, and merchant identity comparison; it never returns order IDs, raw merchant IDs, links, account tokens, credentials, or provider payloads. A configured merchant ID other than the verified Sandbox merchant fails before contacting PayPal.

Acceptance: automated tests prove exact Preview and authorization gates, same-origin enforcement, no explicit `payee`, exact fixture values, safe response shaping, no capture, no persistence or Printful access, merchant preflight, and merchant identity readback when needed. Before the one permitted diagnostic request, the existing temporary Preview authorization must still be valid. Rollback is removal of the diagnostic route/runtime callback and its Preview guard exception; the standard checkout flow is unchanged.
