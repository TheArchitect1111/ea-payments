# Brick Chassis Template V1

## Director's non-negotiable rule
**No brick is live until it auto-wires through `registerBrickEvent()`.**
No brick may call `pushToTrackingPortal`, `confirmTrackingPayment` or write tracking registration metadata directly to Airtable. Client-specific business records can retain their own operational storage, but the tracking portal must receive everything via the shared registrar.

### Canonical files
- `lib/services/brickRegistrar.ts`: sole event entry for calendar, waitlist, form, class, booking, checkout and payment tracking.
- `lib/services/trackingPortal.ts`: underlying transport, durable receipt, tenant identity and test isolation, private to registrar.
- `lib/amanda-catherine/storage.ts` and `app/api/public/amanda/waitlist/route.ts`: Amanda adapters.
- `lib/tb3/brick-events.ts`: Tarris adapter, used by booking, calendar, activity, CSV checkout tracking and signed provider event handlers.
- `app/api/amanda-catherine/preview-dollar-test/route.ts`: existing guarded Amanda preview flow.
- `app/api/tarris/brick-dollar-test/route.ts`: guarded TB3 preview fixture.
- `scripts/guard-brick-chassis.mjs`: mandatory source scan.

## Every brick must provide
`brick_type`, `brick_id`, `client_id`, `registration_id`, `name`, `email`, `phone`, `status`, `payment_status`, `payment_reference`, `timestamp`, `source`, `is_test`.

Use the **same stable registration ID** for first submit and later payment update. The `client_id` prevents cross-client registration collisions. The transport preserves Amanda's legacy stable IDs. For a booking, generate a unique ID for each booking, even when one customer books twice.

## Test isolation and verification
An `is_test: true` event is persisted only to test-scoped tracking storage. Never send it to the live tracking ingest service; never issue fulfillment, entitlement or real customer notification from the fixture. Production test routes must reject GET and POST with 404.

A raw form cannot claim `payment_status: paid`. Only a server-side provider-verified payment event with matching tenant, registration ID, email, brick and payment reference may pass the registrar. Payment-dependent confirmation letters and fulfillment run only after verification and successful tracking, not merely after a browser submit. Seller-attested Bonfire CSV imports can record checkout activity, but are **not** provider-verified payment confirmations.

## Preview-only $1 certification
**Amanda:** open the existing `/api/amanda-catherine/preview-dollar-test` on a preview deployment and follow its authenticated, guarded flow. Its Stripe test-key requirements are separate from production credentials.

**TB3:** POST `/api/tarris/brick-dollar-test` to a preview deployment with `x-tb3-test-key` set to the private `TB3_BRICK_TEST_KEY` secret and a JSON body:
```json
{"testId":"preview123456","brick_type":"payments","name":"Preview Tester","email":"test@example.com"}
```
The request simulates $1 and returns `liveCharge:false`. It never charges Stripe, executes a Bonfire payout or writes a live TB3 registration. A new test ID creates a separate fixture; retries replay the same test identity.

## Adding a future client in under 30 minutes (engineering setup target, not provider approval)
1. **Minutes 0-5:** Find or create the tenant organization ID, portal slug, provider owner and list of active brick options.
2. **Minutes 5-10:** Add a thin tenant adapter forwarding each real signup/booking creation to `registerBrickEvent`, with a stable external business registration ID.
3. **Minutes 10-15:** Wire customer-facing form, calendar and checkout handlers. Do not replace domain persistence; wire tracking after each successful business write. Never infer payment confirmation from client state.
4. **Minutes 15-20:** Add an authenticated preview-only $1 simulated proof route with its own test secret and tenant-scoped `is_test:true` registration.
5. **Minutes 20-25:** Add no-duplicate, cross-tenant and verified-payment tests for the new client; ensure GET/POST of test routes are 404 in production mode.
6. **Minutes 25-30:** Run `npm run test:brick-chassis-guard`, `npm test` and `npm run build`. Ship only via protected PR and EA Production Gate.

**Acceptance:** no tracking bypass, fixture isolation, no confirmation on unverified submit, full branch tests/build green. Thirty minutes is the integration template target; live provider credential issuance, contracts and production verification may take longer.
