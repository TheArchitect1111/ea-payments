# TB3 Path B Release Safety

**Request:** Use committed commerce source `f8c1a036aac47a8f76c595117bf994c86d1c0b10` as the release foundation and add only the minimum safe protections evidenced by Production recovery `07204b603a760e6c947c02ea4d08186ddda6a4f1`.
**Project/tenant:** TB3 / `tarris` on `ea-payments`.
**Owner:** TB3 project owner.
**Status:** Local implementation; not deployed or Production verified.

## Intent

Retain the existing PayPal, Printful, catalog, cart, checkout, webhook, ledger and HQ implementation while making the candidate's offline contracts reflect its committed storefront and protecting shared chassis defaults from false live-success behavior.

## Scope

### In scope
- Correct the TB3 host-routing and storefront assertions to match the existing private HQ login path and Coming Soon/request-first-access storefront.
- Preserve and test the exact-current-source Preview and manifest-only Production release gate.
- Port the recovery checkpoint's fail-closed shared billing, catalog, Jane and offline staging adapter corrections.
- Add SHA-specific local certification evidence.

### Out of scope
- Payment or fulfillment behavior changes, catalog/price/mapping changes, checkout activation, database migrations, provider requests, Production configuration, deployment or unrelated Bonfire integrations.

## Source of truth

- Commerce source: committed tree at `f8c1a036aac47a8f76c595117bf994c86d1c0b10`; its existing working-tree ledger diagnostic modification is excluded.
- Production recovery reference: checkpoint `07204b603a760e6c947c02ea4d08186ddda6a4f1`.
- TB3 catalog: `public/tb3/merch/manifest.json`; 14 products and 82 variants remain `coming_soon` and `fulfillmentMappingVerified: false`.
- Authorization and tenancy: `lib/tb3/server.ts`, `lib/tb3/contracts.ts`, `lib/tb3/paypal-ledger.ts`, `scripts/sql/tb3-paypal-ledger.sql`.
- Release controls: `.github/workflows/ea-master-guard.yml`, `.github/workflows/ea-production-gate.yml`, `scripts/verify-production-gate.mjs`, `scripts/verify-master-promotion.mjs`, and `scripts/vercel-ignore-work-branches.mjs`.
- Governance: `.specify/memory/constitution.md`, `SECURITY-MODEL.md`, and `specs/tb3-commerce-hq/spec.md`.

## Protected invariants

- Preserve PayPal as payment provider and Printful as TB3's sole fulfillment provider; no Bonfire purchasing connection.
- Keep all existing 14 product records, 82 variant records and approved customer prices unchanged. Unverified mappings remain not purchasable.
- Checkout and Printful fulfillment remain disabled until separately approved.
- Preserve authenticated TB3 HQ viewer/admin access, `tarris` tenant scope, webhook verification, idempotency, restricted ledger access and current-source release proof.
- Preserve unrelated EA tenant behavior except fail-closed defaults for unused shared adapters; do not introduce live provider calls in contract mode.
- No remote operation, deployment, database change, provider request, or financial transaction.

## Acceptance criteria

1. Anonymous requests to TB3 private HQ paths follow the existing login return path and render no private HQ content; public TB3 and EA routes remain asserted.
2. Storefront contract retains the committed 14/82 catalog and approved prices, labels items Coming Soon, permits only the existing first-access inquiry, and exposes no purchase/checkout action.
3. Commerce contract proves Printful-only fulfillment, unverified mapping rejection, disabled checkout and authenticated tenant-scoped HQ reporting.
4. Shared chassis adapter corrections return unconfigured/fail-closed evidence and contract-mode runs use offline fixtures with `productionEligible: false`.
5. Release contracts verify source SHA identity, required Preview evidence, manifest-only production promotion, and rejection of unrelated work-branch deployments without hard-coding one historical candidate commit.
6. Relevant offline tests and type checks pass; no tests contact PayPal, Printful, or databases.
7. Corrective commit is a direct descendant of the exact commerce source SHA and evidence records the exact final SHA and each gate result.
8. Production browser assets contain neither known demo fallback passwords nor executable references to server-only credential environment variables; server data modules enforce the Next.js server-only boundary.
9. The chassis source guard normalizes Windows paths before applying its existing canonical registrar and transport endpoint exclusions, while its self-test still rejects direct tracking bypasses.

## Verification plan

Run the TB3 Phase 1 contract, host-routing check after a local build, PayPal/Printful/HQ/ledger diagnostic unit tests, tenant safety, Production protection, master guard and release source-verification contracts, shared Tarris/Amanda chassis contract checks, and scoped TypeScript checks. Review commit ancestry, exact staged paths, catalog invariants, provider boundaries and checkout flags. No production proof is claimed by these local checks.

## Rollback condition

Do not accept the corrective commit if any existing commerce integration, approved catalog data, tenant/auth boundary, disabled-checkout default, provider boundary, production gate, or unrelated tenant contract regresses. Roll back locally by reverting only the corrective commit; the original commerce source commit remains the parent and untouched.

## Completion evidence

Record the final local source SHA, parent SHA, changed-file list, command-level gate outcomes, and any unavailable offline checks in a separate SHA-bound evidence file. Local completion does not mean deployed, Production verified, or launch-ready.
