# TB3 Bonfire Merch Tracking: Conditional Adapter Verification

## Release status
**Feature branch** `fix/tb3-bonfire-integration`. No Bonfire payouts were initiated, and no real order/payment events were submitted.

## Public-provider contract gate
Bonfire's public [integration documentation](https://help.bonfire.com/en/articles/7907234-integrations) does **not establish a generally available creator order webhook, payload schema or signature header**. The implementation therefore treats `x-bonfire-signature: HMAC-SHA256(raw_body, BONFIRE_WEBHOOK_SECRET)` as a **provisional EA integration contract, not a published Bonfire contract**. Production ingestion returns **404** until both `BONFIRE_WEBHOOK_SECRET` and `BONFIRE_WEBHOOK_PROTOCOL_VERIFIED=true` are explicitly configured after confirmation with Bonfire. Missing/invalid signatures fail closed. No real sale is accepted automatically before this validation.

## Feature surfaces
- `POST /api/tb3/bonfire/webhook` validates a candidate signed order and only then performs tenant-locked persistence. `GET` returns 404. Production POST fails closed unless provider protocol is explicitly confirmed.
- `lib/tb3/bonfire-ledger.ts` locks organization to `recxUohHc16hPk1T3`, slug `tarris`, checks Billing and Member admission, and creates durable indexed sale and activity records. Duplicate source order IDs replay the original receipt; changed payloads conflict.
- Canonical Billing `recordVerifiedExternalCommerce` uses **external order identity** to avoid merging repeat purchases by the same buyer; it checks the configured `moduleConfigs.billing.offers` product ID, amount, currency and writes the same payment row with `payment_status=paid`, `payment_reference=Bonfire order ID`, `source=bonfire`. A tracking event is stored separately.
- Real `setModuleEnabled` entitlement writer activates tenant Member selection, then reads back persistence. This is an **organization-wide Member module entitlement**, not a per-buyer authorization or shipping entitlement.
- Tarris-only `P/page.tsx` merch sales tab and `P/reports` views call `GET /api/tb3/bonfire/sales`. The API uses the existing TB3 HQ authorization, returns only hard-locked TB3 tenant sale rows, and supports protected CSV download. Customer PII is never publicly served.
- `/api/bricks/tb3-bonfire-provision-test` has a preview-only admin-authenticated **$1 signature fixture with no DB side effects**. Production GET and POST must both return 404. Durable Billing/Member/report behavior is exercised in the automated isolated lifecycle suite rather than mutating TB3's actual organization.

## Certification requirements and limitations
- Branch CI must pass `npm test`, `npm run build`, HMAC verification, $1 external Billing same-row and replay tests, tenant scoping, Member entitlement readback, report total, and production 404 checks.
- The webhook is **NOT live-Bonfire certified**, because neither webhook support nor signature format has been verified with Bonfire. It must remain disabled until the provider contract is confirmed and a real, authenticated test event is reviewed.
- No live payout, external disbursement or Stripe transaction was requested or performed.
- The registered offer `tb3-tee` is a **fixture**, not a verified product SKU or actual price. A production `moduleConfigs.billing` catalog and matching Bonfire products must be installed before real ingestion.
- Follow-on production acceptance: independently confirm Bonfire connectivity/order notifications; map real product IDs/currency/fees; reconcile refunds and canceled orders; test concurrent webhook replay/atomically committed orders; verify signed order source in a safe preview tenant; confirm TB3 staff authorization and sales privacy.

## Interim seller CSV import (candidate release)
- `POST /api/bricks/bonfire-csv-import` requires **TB3 staff or authorized EA administrator**, using the existing `authorize(req,true)` guard and real TB3 tenant identity. The upload must be a valid CSV/plain-text seller order export no larger than **120 KB**, and the authenticated uploader must attest that each row is paid. PDF/PNG/JPEG uploads remain available through Documents but are **not accepted as payment records**; image-based financial extraction is not certified.
- Required CSV columns: `Order ID,Product ID,Product,Amount,Customer,Email,Date`. USD dollar amounts become integer cents, dates are `YYYY-MM-DD`, quoted CSV commas are parsed, malformed rows are rejected, and a conflicting duplicate order ID fails closed.
- `ingestVerifiedBonfireOrder(...,'bonfire-csv',date)` uses the same tenant-locked canonical Billing reconciliation and Member read-back as webhook orders. Its `tracking` is **Bonfire CSV**, `source` is `bonfire-csv`, and `payment_reference` is the seller order ID. The TB3 Dashboard and Reports consume the same indexed sale ledger; the protected report adds order date.
- A repeated identical CSV is idempotent: orders already processed are not created twice. The importer **only records sales-tracking entries**. No Stripe capture, refund, Bonfire payout or money movement occurs.
- `/api/bricks/tb3-bonfire-csv-provision-test` is a preview-only, admin-authenticated $1 x two fixture parser with no real TB3 database side effects. The executable isolated test suite verifies the complete Billing, Member, read-back and double-import scenario. The test route must return **404 for GET and POST** in production.
- The candidate webhook remains separately **fail-closed** in production until the provider's actual authenticated webhook contract is verified and configured. A merchant CSV export does not authorize enabling that webhook.
- Production requires an actual TB3 `moduleConfigs.billing` offer catalog with product IDs, prices and currency matching the seller export. Imports fail closed if no matching offer exists.
