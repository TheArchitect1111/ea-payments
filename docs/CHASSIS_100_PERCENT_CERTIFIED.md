# Chassis 100% Branch Certification and Production Promotion

## Scope and evidence
- Canonical registry: **23 modules**. Calendar, People and Discovery use dedicated installers; the remaining 20 are marked YES in [REMAINING_BRICKS_CERTIFIED.md](./REMAINING_BRICKS_CERTIFIED.md), under the **isolated Amanda-style branch acceptance boundary**.
- Source branch: `fix/remaining-bricks-certified`. Base production before this release: `0b91edac`.
- Final branch automated proof before PR: [run 38141077078](https://github.com/TheArchitect1111/ea-payments/actions/runs/38141077078): `npm test`, `npm run build`, and all guarded GET/POST production-mode 404 tests passed. Verify PR-head checks separately before merge.
- **Production merge commit:** PENDING, record the GitHub merge SHA after successful PR checks.
- **Certified manifest source commit:** PENDING, populated only by the `EA Production Gate` workflow following master promotion.
- **Manifest-only promotion commit:** PENDING, must be produced by `.github/workflows/ea-production-gate.yml` after visual, functional, protection, routing, build and critic gates pass.
- **Production Vercel deployment SHA / READY:** PENDING until Vercel and the production alias confirm the gate's resulting manifest commit.

## Certification boundary
Branch evidence includes durable/tenant-scoped storage fixtures, replay/identity checks, customer-route handlers, production 404 checks and successful production compilation. It does **not** certify live Airtable, email/SMS, Stripe, social platform, LMS delivery, or full real tenant interactions. A branch-only YES must not be substituted for the independent production gate.

## Tarris / TB3 merchandise storefront tracking
- `moduleConfigs.billing` accepts offers with ID, title, amount, and currency plus confirmation subject/template; the selected Billing module is installer-wired. It can register a buyer by tenant/offer and persist a replay-safe order. The verified-payment adapter updates the **same order row** with `payment_status` and `payment_reference`, and writes a separate payment tracking receipt.
- `moduleConfigs.events` has equivalent registration/payment offer configuration. **There is no separately verified `moduleConfigs.tarrisMerch` or Bonfire webhook integration.** Do not assert that Bonfire sales currently reach this Billing tracking ledger.
- Dashboard currently displays tenant workspace defaults and existing portal activity; Reports can generate authorized, source-indexed operational snapshots. **Merch revenue/order reconciliation from Bonfire to Dashboard and Reports remains an explicit integration task**, not a certified live data path.
- To certify TB3 merch analytics, create/connect a Bonfire order/webhook or import adapter with authenticated tenant identity, stable external order ID, verified paid/refunded statuses, Billing order reconciliation and read-back, plus Dashboard/Reports source mapping. Test duplicate webhooks, refund/reversal and cross-tenant isolation in preview with production test routes returning 404.

## Release invariant
Never overwrite master with feature files outside a normal PR merge. Only the mandatory gate may commit `.ea/gates/latest.json` as the sole file in the production promotion commit. Confirm `ea-payments.vercel.app` is READY and on that exact SHA before marking release complete.
