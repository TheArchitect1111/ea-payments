# Chassis 100% Branch Certification and Production Promotion

## Scope and evidence
- Canonical registry: **23 modules**. Calendar, People and Discovery use dedicated installers; the remaining 20 are marked YES in [REMAINING_BRICKS_CERTIFIED.md](./REMAINING_BRICKS_CERTIFIED.md), under the **isolated Amanda-style branch acceptance boundary**.
- Source branch: `fix/remaining-bricks-certified`. Base production before this release: `0b91edac`.
- Final PR-head branch automated proof: [run 38149105991](https://github.com/TheArchitect1111/ea-payments/actions/runs/38149105991), PASS (tests/build/404). Prior full branch proof: [run 38141077078](https://github.com/TheArchitect1111/ea-payments/actions/runs/38141077078): `npm test`, `npm run build`, and all guarded GET/POST production-mode 404 tests passed. Verify PR-head checks separately before merge.
- **Production feature merge commit:** `3be1e07d5d40d634c1e357ac5f07333ba0d1ece8` ([PR #549](https://github.com/TheArchitect1111/ea-payments/pull/549)). This is the source merge, not the manifest-only promotion.
- **Certified manifest source commit (authoritative):** The `sourceCommit` field in [`.ea/gates/latest.json`](../.ea/gates/latest.json). The gate automatically stamps the exact post-dispatch master source SHA on PASS.
- **Manifest-only production commit (authoritative):** The GitHub history entry immediately following the certified source commit, with the sole changed file `.ea/gates/latest.json`, created by [EA Production Gate](../.github/workflows/ea-production-gate.yml). Verify its SHA against Vercel's deployment `githubCommitSha`.
- **Production READY verifier:** [Vercel production](https://ea-payments.vercel.app). READY must be confirmed separately against the exact manifest-only commit; the prior READY deployment does not qualify.

## Certification boundary
Branch evidence includes durable/tenant-scoped storage fixtures, replay/identity checks, customer-route handlers, production 404 checks and successful production compilation. It does **not** certify live Airtable, email/SMS, Stripe, social platform, LMS delivery, or full real tenant interactions. A branch-only YES must not be substituted for the independent production gate.

## Tarris / TB3 merchandise storefront tracking
- `moduleConfigs.billing` accepts offers with ID, title, amount, and currency plus confirmation subject/template; the selected Billing module is installer-wired. It can register a buyer by tenant/offer and persist a replay-safe order. The verified-payment adapter updates the **same order row** with `payment_status` and `payment_reference`, and writes a separate payment tracking receipt.
- `moduleConfigs.events` has equivalent registration/payment offer configuration. **There is no separately verified `moduleConfigs.tarrisMerch` or Bonfire webhook integration.** Do not assert that Bonfire sales currently reach this Billing tracking ledger.
- Dashboard currently displays tenant workspace defaults and existing portal activity; Reports can generate authorized, source-indexed operational snapshots. **Merch revenue/order reconciliation from Bonfire to Dashboard and Reports remains an explicit integration task**, not a certified live data path.
- To certify TB3 merch analytics, create/connect a Bonfire order/webhook or import adapter with authenticated tenant identity, stable external order ID, verified paid/refunded statuses, Billing order reconciliation and read-back, plus Dashboard/Reports source mapping. Test duplicate webhooks, refund/reversal and cross-tenant isolation in preview with production test routes returning 404.

## Release invariant
Never overwrite master with feature files outside a normal PR merge. Only the mandatory gate may commit `.ea/gates/latest.json` as the sole file in the production promotion commit. Confirm `ea-payments.vercel.app` is READY and on that exact SHA before marking release complete.
