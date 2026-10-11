# Amanda tracking wire: signup, verified payment, private $1 test

Branch: `fix/amanda-tracking-wire`. The public waitlist handler was not changed.

## Registration routes
1. The public course form posts to `/api/public/amanda/waitlist`. Its existing call to `pushToTrackingPortal` remains intact.
2. Portal application, waitlist, and enrollment forms post to `/api/amanda-catherine/submit` through the portal alias. `handleAmandaSubmit` now calls the same tracking service. Applications without a course use `class_id=application`, `registration_type=waitlist`.
3. Each signup event carries `registration_id,first_name,last_name,email,phone,class_id,class_name,registration_type,payment_status,payment_reference,timestamp,source,is_test,event_type`. The legacy public payload remains accepted and is normalized in the service.

The existing `portal_registrations` table remains the live lead index using a stable `registration_key=email:class_id`. Extended data and payment references are stored in dedicated `amanda-tracking-meta-*` Creative Studio records to avoid assuming unprovisioned Airtable fields. Repeat payment notifications **update** the same metadata record; payment is never inserted as a new lead. The EVA count continues to read only the live lead table.

## Square production payment
A LIVE public registration displays a **Continue to secure Square payment** button after confirmation. Portal READY enrollment now records a signup before requesting a dynamic checkout. The new `POST /api/amanda-catherine/square-checkout` verifies the registration, creates a correlated Square payment link, and stores an order-to-registration mapping.

Configure Square production credentials server-side: `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `SQUARE_WEBHOOK_NOTIFICATION_URL`. The last value must exactly match the publicly subscribed notification URL (`https://amandacatherine.ca/api/webhooks/square-amanda` if using Amanda's domain). Subscribe Square to `payment.created` and `payment.updated`. The webhook verifies HMAC-SHA256 against the raw body, retrieves the payment directly from Square, requires `COMPLETED` and matching CAD amount/order, then changes the existing registration to paid and sends Amanda's confirmation letter. Temporary failures return non-2xx for Square retry. Uncorrelated legacy static Square links intentionally cannot mark a registration paid. Do not remove such links until every CTA uses the correlated checkout.

## Private $1 full-chain test
In the Amanda owner portal, open `/portal/amanda-catherine/billing`. Enable the existing **$1 test** toggle in EA HQ if currently off. Under **Private workflow testing**, enter a **Test signup name**, then select **CAD $1 — 3-day test, no auto-charge** on a READY course.

This creates a `[TEST]` signup record in an isolated `amanda-tracking-test-*` Creative Studio namespace, **not** `portal_registrations` or EVA production counts. Stripe charges CAD $1. Its signed webhook or authenticated return verification checks payment status, updates the same isolated test record to paid, provisions 72-hour trial access, sends payment receipt and Amanda confirmation letter. The verification return screen offers **Verify isolated tracking event**. This opens authenticated `GET /api/portal/amanda/tracking-test?registration_id=<id>` showing `is_test=true`, `payment_status=paid`, and the Stripe payment reference. The test checkout name and email come from the signed-in owner session and test input.

No real charge was issued during development. To certify a real payment, use the owner-only $1 button with a payment method on the preview deployment and verify the post-payment event and letter. Do not release before confirming Square webhook subscription/credentials and payment return with a real or Square Sandbox transaction.

## Failure handling and reconciliation
Signup tracking failures queue to `tracking_sync_failures` with the existing five-minute retry cron. Signed payment webhooks fail closed if no matching signup exists; they never create placeholder leads. Test events bypass the public ingest entirely. The authorized tracking ingest endpoint now accepts both backwards-compatible signup payloads and `event_type=payment_confirmed`, which only updates an existing record.
