# TB3 PayPal checkout

**Request:** local implementation on work/ayf-chassis-20261103. **Status:** IMPLEMENTED and locally tested; not deployed or activated. Production is not VERIFIED.

## Intent and authority
The Bouie family authorizes PayPal payments and Printful fulfillment. Existing TB3 catalog, server cart resolver, Printful adapter, cost-approval gate, SECURITY-MODEL.md and user instructions are authoritative. No real payments, credentials requests, account provisioning, production settings, commits or deployments.

## Scope and invariants
Add independent gated PayPal routes and checkout page. Existing Stripe checkout/webhook, artwork, catalog and HQ remain untouched. Official Orders v2 create/approval/capture flow; PayPal-hosted eligible card funding. Never collect card data. Secret/OAuth tokens stay server-side; no credentials or provider bodies in logs. Browser amounts, merchant IDs and tenant IDs cannot establish payment truth. US shipping only; tax collection is not guessed: explicit reviewed no-collection states are the initial tax adapter, other destinations fail closed pending an approved tax adapter.

## Acceptance criteria
1. Server-resolved cart, immutable delivery address, approved shipping quote, USD totals and pinned family merchant are verified before and after capture.
2. A durable intent exists before provider create; stable provider request IDs, transactional locks and unique provider/capture IDs prevent duplicate payment records. Ambiguous network outcomes reconcile by provider GET before another capture. Expired intents cannot initiate a capture.
3. Paid state requires one completed/final capture, exact currency/amount, invoice/custom IDs, family payee and provider-verified capture/order. Pending/denied/mismatched payments never fulfill.
4. Signed webhooks are verified through PayPal before state changes; capture/approved events reconcile provider truth. Refund/reversal events hold fulfillment. Unknown/forged events never invent orders.
5. Printful uses the existing transport/store/catalog, deterministic store-unique external IDs, exact order identity and fresh payment checks. Persist a confirmation attempt before an irreversible confirmation; ambiguous confirmation outcomes are quarantined instead of blindly retried. Merchant cost/funding/approval gates remain mandatory.
6. Disabled-by-default production/sandbox separation, same-origin buyer calls, opaque checkout ownership token, bounded inputs and controlled tests. Existing checkout remains unchanged.

## Plan / tasks
- [x] Read governance, installed Next route documentation and official PayPal documentation.
- [x] Implement provider transport, state machine, restricted durable ledger and additive SQL migration (not applied).
- [x] Add gated routes/page with PayPal SDK eligibility checks and explicit cancellation/failure states.
- [x] Behavioral tests for pricing, capture failures/retries/concurrency, webhook authenticity and Printful handoff; necessary existing payment regressions only.
- [x] Record exact environment names, test evidence and remaining activation approvals.

## Rollback and production proof
Keep TB3_PAYPAL_ENABLED unset/false to disable all new routes/page. No data deletion or Stripe fallback modification. Live certification requires approved ledger migration/role grants, merchant ownership/card eligibility, tax policy, webhook registration, catalog/Printful funding verification, controlled sandbox flow, final build/release gates and separately authorized live verification. No implementation or mocked test may be called production VERIFIED/DONE.

## Safety hardening acceptance — 2026-11-07

Authorized scope: sandbox must use deterministic local shipping/fulfillment simulation, never the Printful transport, including when production keys/approval flags are present. Sandbox records require an explicitly selected sandbox database; no production database fallback. Live confirmation must re-fetch approved store identity, sync product/variant identities and the draft with its current costs inside the existing locked confirmation phase. Any failure preserves the paid record, quarantines fulfillment and sends no confirmation. No other client/Stripe routes change.

Migration preflight must use a read-only transaction and catalog metadata only. Report absent versus compatible existing table versus incompatible collision, required role availability and inspection failures. An existing table must never authorize replay of the create migration. The migration itself must abort on any name collision, including one introduced after preflight. No migration or external service call is authorized in this run. Tests inject provider/catalog/database fixtures. Rollback remains disablement; production verification and approval remain required.
