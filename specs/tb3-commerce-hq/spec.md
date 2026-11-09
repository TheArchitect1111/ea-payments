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
