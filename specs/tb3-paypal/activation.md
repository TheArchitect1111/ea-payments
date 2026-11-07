# TB3 PayPal activation contract

Local implementation only. Existing Stripe checkout, Stripe webhook, catalog, artwork and HQ are unchanged. No production configuration was read or changed. No credentials were requested. No payment, Printful order or migration was sent to a real service.

## Exact Vercel configuration names

Configure the intended environment separately; do not copy sandbox values into Production.

| Name | Requirement |
| --- | --- |
| `TB3_PAYPAL_ENABLED` | Explicit `true` enables the new flow only after release approval; otherwise disabled. |
| `TB3_PAYPAL_ENV` | `live` requires platform `VERCEL_ENV=production`; `sandbox` is rejected in Production. |
| `TB3_PAYPAL_CLIENT_ID` | Merchant app public client ID, exposed only by the gated config response. |
| `TB3_PAYPAL_CLIENT_SECRET` | Server-only merchant app secret. |
| `TB3_PAYPAL_MERCHANT_ID` | Exact approved family merchant ID; pinned in Orders and verified before capture. |
| `TB3_PAYPAL_WEBHOOK_ID` | Webhook registration ID for the same app/environment. |
| `TB3_PAYPAL_ORIGIN` | Exact approved HTTPS origin, without path or trailing slash; no origin is assumed here. |
| `TB3_PAYPAL_DATABASE_URL` | Live-mode restricted PostgreSQL connection; falls back to `EA_MERCHANT_DATABASE_URL` only in live mode. |
| `TB3_PAYPAL_SANDBOX_DATABASE_URL` | Required for sandbox only. Explicit nonproduction database with the restricted ledger role; no live fallback. Known matching live database identities are rejected. |
| `EA_MERCHANT_DATABASE_URL` | Required if the PayPal-specific database URL is absent. Existing restricted role and verified TLS only. |
| `EA_MERCHANT_DB_CA_PEM` | Optional trusted CA when required by the approved database connection. Never disable TLS validation. |
| `PRINTFUL_API_KEY` | Live mode only: existing server-only Printful access, fixed store 18945233. Never used by sandbox. |
| `TB3_PRINTFUL_CATALOG_VERIFIED` | Live mode: must be `true`; selected products are also checked against the provider before checkout. |
| `TB3_PRINTFUL_FUNDING_VERIFIED` | Live mode: must be `true` before accepting payment. |
| `TB3_MERCH_DRAFT_FULFILLMENT_APPROVED` | Live mode: must be `true` before accepting payment and creating paid-order drafts. |
| `TB3_PAYPAL_TAX_POLICY_APPROVED` | Live mode: must be `true` after an authorized tax-policy review. |
| `TB3_PAYPAL_NO_TAX_STATES` | Reviewed comma-separated US destination state codes where this merchant need not collect sales tax. This is a policy, not a tax engine. All other destinations fail closed. Never list states merely to enable checkout. |
| `TB3_PAYPAL_AUTO_FULFILLMENT_APPROVED` | Optional explicit `true` authorizes manufacturing confirmation; otherwise verified payments create drafts only. |
| `TB3_MERCH_MAX_PRINTFUL_COST_CENTS` | Positive integer cost ceiling required for automatic confirmation; supplier cost must also remain below merchandise subtotal. |

No `NEXT_PUBLIC_*` secret is used. Existing Stripe enablement and credentials are not prerequisites for this independent PayPal path and are not changed.

## Routes and merchant setup

The new page is `/tarris/paypal-checkout`. New APIs are `/api/tb3/paypal/config`, `/orders`, `/capture`, `/cancel` and `/webhook` under that prefix. There is no storefront link switch or replacement of existing checkout. Disabled configuration returns an unavailable API and a 404 page.

Register the approved origin's `/api/tb3/paypal/webhook` with the same merchant app/environment. Required event types: `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.REVERSED`. Verification uses PayPal's signature postback and configured webhook ID before processing. Events re-fetch Orders/captures rather than trusting payload amounts. Refund/reversal events hold future fulfillment; they do not automatically refund, cancel a manufactured order, or send messages.

PayPal Standard SDK renders PayPal and card funding only when the merchant/buyer is eligible. The application does not collect card numbers. Advanced card fields, guaranteed guest-card availability and merchant underwriting are not implied.

### Sandbox isolation (hardened)

`TB3_PAYPAL_ENV=sandbox` uses a deterministic fixture shipping charge of $5.00 USD and zero simulated tax, then records `fulfillment=simulated` after verified sandbox capture. These are test fixtures, not live quotes or tax policy. It never calls the Printful port for catalog, shipping, drafts, lookup, confirmation or replay. The separate live quote entry point rejects sandbox mode before transport access. Even mistakenly present Printful keys and manufacturing approval flags cannot enable sandbox fulfillment. The page and receipt explicitly disclose simulation. Sandbox requires no Printful key, live funding approval or retail-tax approval flags. Production tax/funding/approval requirements remain unchanged.

Sandbox PayPal app credentials, merchant ID, webhook ID and exact origin still need explicit configuration in a nonproduction context. Set `TB3_PAYPAL_ENABLED=true` only in that authorized context, with `TB3_PAYPAL_ENV=sandbox`, never in Production. Select `TB3_PAYPAL_SANDBOX_DATABASE_URL` for an operator-verified isolated database; no live URL fallback is allowed. The code rejects known matching live database identities, but the operator must verify that pooler/direct aliases do not point to the same production database. Separate nonproduction database approval remains mandatory.

Sandbox acceptance now means real sandbox PayPal/ledger verification with **simulated Printful fulfillment**. It is not certification of live Printful manufacturing. This run used only controlled mocks, not real sandbox transactions.

## Required approvals and verification before activation

1. In the approved environment, run the explicit read-only command below against the intended sandbox database first. It inspects PostgreSQL relation/type names, columns, generated identities, required checks/key constraints, RLS state and role existence; it does not read customer rows. PASS means the target name is absent and required migration roles exist, not permission to apply. A compatible existing table is still BLOCKED for this create migration; an incompatible relation/type collision or inspection failure also blocks. Do not replay this migration against an existing ledger. After separate approval, have a migration administrator apply `scripts/sql/tb3-paypal-ledger.sql`, then verify runtime grants, RLS, unique IDs, locks, rollback, TLS and concurrency. The SQL now uses plain `CREATE TABLE`, so a race-created collision aborts before later RLS/permission statements. It creates no accounts and modifies no existing payment tables. Default runtime role is `ea_merchant_api`; a dedicated `tb3_paypal_api` role requires equivalent separately approved policy/grants. Establish access/retention procedures for stored email/delivery addresses.
2. Have the authorized operator verify the supplied app credentials, pinned merchant ID, origin and real webhook registration in the intended environment without exposing values. Verify account/card eligibility with PayPal.
3. Approve destination tax treatment; either use genuinely reviewed no-collection states or add an approved tax-calculation adapter before accepting taxable destinations. No supplier tax is treated as retail sales tax.
4. Verify the approved Printful catalog/artwork, billing funding, draft permission and optional manufacturing approval/cost ceiling. Ambiguous confirmation attempts stay in review; operators must reconcile the existing external order rather than blindly confirming again.
5. Run an authorized sandbox browser/SDK-to-Orders-to-isolated-database acceptance with simulated Printful fulfillment. Verify eligible card/PayPal methods, webhook delivery, declines/pending states, retries, refunds, and zero Printful traffic. Current tests use controlled mocks; no external sandbox or live service has been certified. Live Printful verification requires separate approval; never use the real store as the sandbox.
6. Integrate this additive implementation into the production-based release candidate while retaining its other client commits and the approved existing Printful implementation. Prior evidence identifies production `87b5484` as missing this branch's Printful source; this task does not resolve or deploy that separate release integration. Complete final build, payment/security/client release gates and obtain explicit activation approval. Keep `TB3_PAYPAL_ENABLED` disabled until then.

Rollback: disable `TB3_PAYPAL_ENABLED`; do not delete the ledger or switch existing checkout. Preserve outstanding provider IDs and reconcile paid/draft/review records before any later reactivation. A deployment without webhook reconciliation cannot certify live checkout.

Read-only preflight commands (prepared, **not executed against a database in this run**):

```powershell
node --import tsx scripts/tb3-paypal-migration-preflight.mts --database-env TB3_PAYPAL_SANDBOX_DATABASE_URL
# Later, only in an explicitly approved live inspection context:
node --import tsx scripts/tb3-paypal-migration-preflight.mts --database-env TB3_PAYPAL_DATABASE_URL
```

If the approved live ledger uses the existing fallback variable, explicitly select `--database-env EA_MERCHANT_DATABASE_URL`. The CLI never auto-loads `.env` files, selects an implicit database, prints connection values, or executes DDL. It requires verified TLS and uses `BEGIN ... READ ONLY`, catalog queries and `ROLLBACK`. A failed inspection is BLOCKED. Existing-schema compatibility is a conservative structural check; it does not certify grants/policies or authorize altering an existing ledger.

Immediately before live confirmation, the locked confirmation phase reads `/stores/18945233`, the relevant `/store/products/{id}` records and `/orders/{id}`. It checks the returned store, sync product, sync and catalog variants, availability/files, exact frozen order identity, draft status and fresh USD cost. It re-reads current approval, funding and cost-ceiling flags, enforcing the existing margin gate. Any mismatch/unavailability leaves fulfillment in review with no confirmation POST. Provider changes after the final read cannot be made atomic by the application; live provider-contract acceptance is still required.

## Official references used

- [PayPal Standard checkout and eligible card buttons](https://developer.paypal.com/studio/checkout/standard/integrate)
- [Orders create](https://developer.paypal.com/api/orders/v2/orders-create) and [capture](https://developer.paypal.com/api/orders/v2/orders-capture)
- [Capture details and related order identity](https://developer.paypal.com/api/payments/v2/captures-get)
- [REST idempotency](https://developer.paypal.com/api/rest/reference/idempotency/)
- [Webhook verification](https://developer.paypal.com/api/rest/webhooks/rest/)
- [Printful store, sync product and order APIs](https://developers.printful.com/docs/)
- [PostgreSQL read-only transaction restrictions](https://www.postgresql.org/docs/current/sql-set-transaction.html)
