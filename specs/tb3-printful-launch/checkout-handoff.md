# TB3 merchandise checkout handoff

Status: **NOT LIVE; do not activate payment collection**.

## Implemented on this isolated branch
- 14-item Printful-backed catalog and cart are preserved.
- Public merch UI now supports U.S. delivery-address entry and gated Stripe checkout.
- Checkout uses TB3-specific Stripe credentials, never the Efficiency Architects service-deposit account.
- Server validates cart prices and quantities, asks Printful for shipping, uses the quoted shipping method, and passes the destination to a Stripe customer for Stripe Tax.
- A dedicated signed webhook checks completed payment via Stripe, then creates a Printful **draft** using a deterministic store-unique external order ID. Repeated webhook delivery must not create a second order.
- **Printful draft orders are not yet automatically confirmed for production**. They require approval after confirming the family's payment and Printful billing responsibilities.

## Conditions before a LIVE switch
1. Tarris's parents/authorized business owner identify or open the appropriate Stripe merchant account and connect their bank for payouts. Ensure the Printful payment method belongs to the intended operator. EA's service payment account must not receive TB3 merch revenue.
2. Deploy the TB3 Stripe secret and the exact corresponding webhook signing secret for `/api/webhooks/stripe-tb3-merch` in the appropriate Vercel environment. Verify the Printful token has orders/shipping access for store 18945233. Do not paste keys into tickets or chat.
3. Perform Stripe Tax registrations/liability and accurate shipping/tax checks, including address and quoted-vs-actual shipment costs; resolve margins and refunds.
4. Test signed webhooks (including retries, duplicates, missing signature, unpaid sessions), fulfillment drafts, Stripe payment reconciliation, and manual Printful approval. Verify print assets and product availability in Printful.
5. Test desktop/mobile, public merch landing links from Instagram, TB3 portal access, refund handling, and tracking of real payment vs Printful retail totals.
6. Test in preview, pass build/CI, then deliberately enable `TB3_MERCH_CHECKOUT_ENABLED=true` and `TB3_MERCH_DRAFT_FULFILLMENT_APPROVED=true` **only after explicit owner approval**. Until then both must remain unset.
7. Run a controlled low-value test order, confirm Stripe payment, inspect corresponding Printful draft, manually approve production, and capture delivery tracking. Avoid production activation if any stage fails.

## Gallery decision
- Owner-approved final gallery: Drive (video), Defense (video), Scoreboard (photo). Putback is omitted. Deprecated Dunk and Jumbotron clips are removed from the gallery.

## Safety boundary
- Existing /api/checkout/tarris-bouie is the unrelated $500 EA deposit.
- The shared Stripe webhook and Amanda payments are untouched.
- All TB3 merch functionality fails closed until flags and TB3-owned credentials are present.
- Existing local uncommitted assets and chassis guard changes are NOT incorporated in these remote commits.
- This branch is not merged or production-certified.

## Reusable payment-onboarding brick (October 25)
- Added reusable tenant-isolated contract at `lib/bricks/merchant-onboarding/contract.ts`.
- PayPal and Stripe are **processors**. Venmo is a potentially available method under PayPal; Cash App Pay and ACH under Stripe, subject to merchant eligibility and provider capabilities. Direct cash transfers and bank routing information are **not** treated as automatically verified checkout methods.
- Added read-only selection/status UI `MerchantPaymentSetup.tsx`, visible to TB3 staff on their reports page. It does not collect banking data, claim the account is connected, or open an unauthorized provider onboarding URL.
- A fully functional **Connect** flow still requires a verified provider partner/onboarding integration, secure credential/token storage, merchant-account capability verification, and a server-side webhook. Do not enable a button or infer payment readiness from a PayPal handle.
- Existing Stripe-only TB3 merchandise checkout stays disabled pending supported processor connection.
