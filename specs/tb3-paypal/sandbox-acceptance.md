# One controlled TB3 PayPal sandbox acceptance

Prepared only. No secrets accessed/configured, database created/changed, migration applied, server started, payment processed or deployment authorized by this packet. Use the existing TB3 repository/project. Keep live checkout unchanged and live PayPal enablement off.

## Operator checklist before execution

- [ ] Approve the existing nonproduction runtime and exact HTTPS origin reachable by the browser and PayPal webhooks. Do not assume localhost can receive webhooks; any tunnel/public exposure or deployment requires its own approval. No new project is required.
- [ ] Identify an approved existing isolated sandbox database. Confirm its project/database identity directly, including pooler aliases, and that it is not the live merchant database. Do not create or migrate it as part of preparation.
- [ ] Confirm a sandbox business app/merchant and sandbox buyer are available. Supplied live credentials cannot substitute for sandbox credentials. Verify eligible card/PayPal methods; card eligibility is not guaranteed.
- [ ] Through the authorized operator, configure the variables below in the approved nonproduction context only. Secret access/modification requires separate approval; never paste values into reports.

| Variable | Sandbox requirement |
| --- | --- |
| `TB3_PAYPAL_ENABLED` | Remain false/unset until the controlled run is approved; true only in its sandbox context. |
| `TB3_PAYPAL_ENV` | `sandbox`; platform `VERCEL_ENV` must not be `production`. |
| `TB3_PAYPAL_CLIENT_ID` / `TB3_PAYPAL_CLIENT_SECRET` | Same sandbox merchant app. |
| `TB3_PAYPAL_MERCHANT_ID` | Exact sandbox business merchant ID, not the live merchant ID. |
| `TB3_PAYPAL_WEBHOOK_ID` | Same sandbox app's registration for the approved origin plus `/api/tb3/paypal/webhook`. |
| `TB3_PAYPAL_ORIGIN` | Exact approved HTTPS origin, no path/trailing slash. |
| `TB3_PAYPAL_SANDBOX_DATABASE_URL` | Isolated database with the approved restricted runtime role. No live fallback. |
| `EA_MERCHANT_DB_CA_PEM` | Approved CA only if required; retain certificate verification. |

No Printful key, store access, live tax-policy approval or manufacturing approval is required for sandbox. Do not enable or repurpose live credentials/funding flags to make sandbox work. Use fixture identity/address data only, no real customer information.

## Database sequence, with separate migration approval

1. Once secret access and the target context are separately approved, run the existing read-only preflight:

   ```powershell
   node --import tsx scripts/tb3-paypal-migration-preflight.mts --database-env TB3_PAYPAL_SANDBOX_DATABASE_URL
   ```

2. If absent-name/role checks PASS, retain the sanitized result and request approval for the exact migration and target. PASS does not authorize writes. Any existing relation/type blocks this create migration, even if structurally compatible. A compatible existing ledger needs a separate read-only runtime grants/RLS review; never replay the create migration.
3. Only after separate approval, the migration administrator applies `scripts/sql/tb3-paypal-ledger.sql` to the isolated database and verifies runtime privileges/RLS. The default grant is for `ea_merchant_api`; an approved dedicated role requires separately reviewed equivalent grants/policy. No user/account creation is included here.

## Single acceptance session

Execute once only after the above approvals and explicit sandbox-run authorization. PayPal refund creation is an additional sandbox-only write and must be included explicitly in that authorization if exercised. No live payment or real Printful fulfillment is part of this session.

1. Start the approved nonproduction runtime. Confirm `/api/tb3/paypal/config` exposes only availability, public client ID and currency. Confirm `/tarris/paypal-checkout` displays the sandbox/simulation notice.
2. Submit one canonical TB3 variant, quantity and fixture delivery address. Verify the provider approval total equals server catalog subtotal plus the explicit $5.00 fixture shipping and zero simulated tax. Use only the authorized sandbox buyer/payment method.
3. Approve and capture once. Verify the PayPal sandbox order/capture, exact merchant/currency/amount and one persisted sandbox ledger record with `state=paid`, `fulfillment=simulated`, no Printful ID. Do not publish provider/customer identifiers or credentials in evidence.
4. Check payment status and replay the legitimate signed completion webhook for that same order. Verify unchanged capture identity, a single ledger record and zero Printful traffic/orders. Do not start a second checkout to test duplicate capture.
5. With the same completed order, submit a forged webhook and a wrong ownership token; verify rejection and no state change. Never forge or expose real signature secrets.
6. If an explicitly approved sandbox refund/event is included, verify its authentic webhook places the same ledger record on hold and a later capture/status request cannot resume fulfillment. Otherwise record external refund acceptance as NOT RUN; retain existing offline refund evidence without claiming external verification.
7. Decline/pending/card-eligibility cases require sandbox-provider-supported scenarios. If unavailable in this one session, record them NOT RUN and reference the existing passing offline cases. Do not fabricate provider outcomes or create extra orders without approval.
8. Disable the sandbox enable flag through the authorized operator at the agreed end of the session. Preserve the test ledger/provider IDs for reconciliation. Do not delete records or alter live checkout.

## Evidence and stop conditions

Record timestamp, code commit, approved environment/target identity (no connection string), sanitized preflight result, browser/provider/database status, duplicate-record counts, authenticated webhook delivery and zero Printful network requests. PASS requires evidence for each exercised step; distinguish NOT RUN/BLOCKED cases. Stop on production context, live credentials, wrong merchant/database, any Printful request, amount mismatch, unauthorized access, duplicate capture or schema collision. Preserve evidence and keep enablement off; no blind retry or live fallback.

Sandbox acceptance certifies sandbox payments with simulated fulfillment only. Live activation still requires the separate tax, Printful funding/catalog/approval, production database, final build/release and activation gates in `activation.md`.

## Prepared local commit

Proposed subject: `feat(tb3): add isolated PayPal checkout and fulfillment safeguards`

Scope: additive PayPal routes/page, provider verification and durable ledger, isolated sandbox simulation, fresh Printful confirmation guards, read-only migration preflight, targeted tests/typecheck, specifications and evidence. Exclude AYF logs/evidence patches, generated test directories, credentials and unrelated files. Commit, push, deployment, migrations and credential access are not approved by staging this packet.
