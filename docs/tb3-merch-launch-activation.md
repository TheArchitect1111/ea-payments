# TB3 Merchandise Launch: Activation and Release Gates

Status: **not authorized for customer payments or Printful production**.
Branch: `work/ea-stripe-connect-onboarding-20261025`. PR #608 is draft.
Store: Printful manual/API store 18945233. Channels: tb3.online and Instagram.
Never substitute another print-on-demand platform without explicit owner approval.

## Certified in code, subject to latest green run
- 14 TB3 products use a shared website and portal manifest.
- Product images, shopping cart and mobile product anchors have Chromium browser coverage.
- Stripe Connect checkout and webhooks are tenant-scoped to Tarris.
- Paid orders create Printful drafts before authorization.
- Printful confirmation uses the same tested cost and funding gate as the sandbox.
- Meta Instagram feed remains closed when Stripe/Printful prerequisites are missing.
- Financial/fulfillment reports and live Printful catalog audit require portal staff status.
- Funding ledger refuses to authorize repayment from estimated sales or unverified cash.

## Live Printful catalog
1. An authorized TB3 portal staff user uses the private "Verify 14 products against Printful" control.
2. Require 14/14 matched with zero missing variant IDs and none ignored/discontinued/unavailable.
3. Independently inspect each product's print files, print resolution, print placements, mockups, and final manufacturing/retail pricing. A catalog ID match is not a print-quality certification.
4. Confirm shipping methods for representative permitted US addresses.

## Authorized merchant owner actions (pending)
1. Complete Stripe Connect identity/business/KYC and bank payout verification for the lawful TB3 merchant.
2. Record documented parent-loan amount **actually received**; approval to fund up to $500 is not receipt of $500.
3. Connect an authorized Printful billing instrument with sufficient available balance for real fulfillment.
4. Record funding verification and an order-level Printful cost limit only after confirmation. Keep checkout and automatic fulfillment OFF until then.

## Safe controlled canary
1. Verify Preview and GitHub tests pass at the exact release commit and there are no Amanda/other-tenant changes.
2. Verify merchant charges and payouts enabled, webhook signing secret present, storefront live Printful API reachable, and all inventory is compatible.
3. Run an owner-authorized real low-cost Stripe purchase of a TB3 product with a deliverable address. This is a **real charge**, not a sandbox simulation.
4. Verify one connected Stripe paid event, correct connected account, matching catalog subtotal, Printful draft, **one** authorized confirmation and one actual Printful billing charge. Replay webhook and ensure no second charge.
5. Verify fulfillment event, tracking, shipping, fee and payout reporting. Refund only if the owner specifically authorizes a refund.
6. Reconcile deposits and Printful expenses against actual settlement data. Hold at least $500 working capital before considering any parent repayment.

## Instagram activation
1. Authorized Meta account owner links the professional Instagram profile to its Facebook Page and business portfolio.
2. Verify the sales domain `tb3.online` within Meta and satisfy Commerce eligibility and policies.
3. After live checkout, verified Printful inventory, and owner approval, enable the gated product feed:
   `/api/tb3/merch/meta-catalog` on the API host serving the TB3 backend.
4. Import and review the feed in Meta Commerce Manager, connect it to the correct Instagram profile and await Meta's review.
5. Test a tagged product link: Instagram -> TB3 product anchor -> paid Stripe checkout -> Printful -> portal tracking. The feed uses campaign tags and the portal reports Instagram-attributed paid orders, but these are URL-based, not independent Meta analytics.
6. Do not claim Meta Shop is connected before the Meta owner completes connection and Meta approves the catalog.

## Stop conditions
- Missing account-owner permission or verified funding
- Catalog mismatch or missing print-ready artwork
- No successful provider-backed payment-to-fulfillment canary
- Checkout/webhook production flags enabled before provider readiness
- Security, mobile or tenant-isolation regressions
- Any unauthorized change to Amanda or unrelated clients

No live checkout, charging, fund transfer or parent-loan repayment is authorized merely because code tests pass.
