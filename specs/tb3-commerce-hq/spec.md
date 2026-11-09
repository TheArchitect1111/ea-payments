# TB3 Commerce Reporting and Fulfillment Safety

**Request:** Connect TB3's PayPal ledger and Printful fulfillment records to private HQ reporting, remove TB3 dependencies on Bonfire/Fourthwall/Stripe merchandise reporting, and validate the preserved Printful catalog.
**Project/tenant:** TB3 / tarris
**Owner:** TB3 project owner
**Status:** Implemented on isolated development branch; not deployed or Preview certified

## Intent

TB3 commerce uses TB3 storefront → PayPal → Printful → TB3 HQ. HQ read views derive from the durable PayPal order ledger and Printful fulfillment records. The public storefront remains Coming Soon and all payment/fulfillment actions remain disabled.

## Scope

### In scope
- [x] Isolated branch based on production commit plus preserved PayPal certification changes.
- [x] Remove TB3-only Bonfire, Fourthwall, and Stripe merchandise-reporting paths.
- [x] Read-only, tenant-scoped PayPal ledger and Printful shipment reconciliation in Tarris HQ.
- [x] Validate all 14 product / 82 variant entries from the preserved manifest.
- [x] Enforce fail-closed Printful mutation gate and idempotent reconciliation.
- [x] Focused isolated tests.

### Out of scope
- Production database/configuration changes, deployment, checkout activation, credentials, live PayPal, Printful submissions, separate contractual deposit system, unrelated client behavior.

## Source of truth

- Production base: commit `4c4ef1418c3d395009f3b0a16812bba8a161fa3e`.
- Preserved PayPal certification branch: `work/tb3-paypal-cert-20261107` and `specs/tb3-paypal/local-simulator-certification-20261107.md`.
- Preserved manifest on that branch: `public/tb3/merch/manifest.json` (14 products / 82 variants).
- Durable schema: `scripts/sql/tb3-paypal-ledger.sql`; previously applied production migration 20261108005642 is not repeated.
- Authorization: `lib/tb3/server.ts`; Tarris org membership and viewer role are required for reads.
- Security: `SECURITY-MODEL.md` and `.specify/memory/constitution.md`.

## Protected invariants

- Public merchandise remains Coming Soon; checkout and PayPal remain disabled.
- No Printful draft/confirmation mutation unless explicitly enabled in the production runtime with existing approval/funding gates.
- No production/database/configuration/provider access in this work.
- Tarris reports are tenant-scoped and private, uncached, read-only, and do not expose shipping addresses or customer email.
- Existing PayPal idempotency, webhook verification, forced RLS and least-privilege ledger controls remain intact.
- Separate contractual deposit and unrelated client payment behavior remain intact.

## Acceptance criteria

1. No active TB3 dependency remains on Bonfire, Fourthwall, or Stripe merchandise reporting; shared unrelated Stripe code is unchanged.
2. Authorized Tarris viewer can read orders, capture/payment state, fulfillment state, shipment tracking, refunds, and gross/net revenue derived from the PayPal ledger and Printful records.
3. Unauthenticated and non-Tarris/non-viewer requests are rejected; response uses `private, no-store` and excludes unnecessary PII.
4. The preserved catalog validates to 14 unique products and 82 unique mapped variants; each has required product/variant/catalog IDs and consistent variant/product price. Live Printful catalog checks are clearly called out as external.
5. Retried or duplicate webhooks cannot create duplicate PayPal ledger rows or Printful orders; failed/held/refunded payments cannot initiate fulfillment.
6. With commerce disabled, Printful draft and confirm POSTs are impossible and existing disabled checkout/Coming Soon UI remains.
7. Focused integration, security, and regression tests pass in isolated local fixtures; prior 31 local PayPal tests are preserved and not re-run wholesale.
8. No production deployment is performed; therefore Preview certification remains a separate follow-up.

## Verification plan

- Run catalog contract, ledger/report route tests, fulfillment mutation gate tests, existing focused PayPal HTTP case, TypeScript dependency diagnostics, and relevant Coming Soon regression.
- Inspect final diff and branch ancestry; verify no provider/DB/env access in test commands.
- Live Printful catalog/SKU/pricing/shipping and Preview/PayPal webhook checks remain external and are not attempted.

## Rollback condition

Any loss of Coming Soon/disabled checkout, tenant/auth bypass, non-idempotent fulfillment, exposure of address/email, mutation attempted while disabled, or change to unrelated Stripe/deposit/client files blocks the release candidate. Revert only this branch's TB3 patch before preview.

## Completion evidence

Local evidence: 5/5 commerce/HQ tests passed; 12 focused PayPal regression tests passed; the TB3 Coming Soon contract passed; focused TypeScript check reported zero TB3 diagnostics (17 unrelated repository dependency diagnostics); focused ESLint passed with three existing `<img>` warnings in the HQ page and zero errors. The preserved suite's 31 passing local simulator tests were not repeated. The Desktop/mobile Playwright command could not start because Turbopack rejected the isolated worktree's shared `node_modules` junction as outside its filesystem root. No database/provider calls or deployment occurred. This source checkpoint is ready for Preview certification, but rerun the browser case in CI/standard checkout and complete real Preview/provider verification before certification.
