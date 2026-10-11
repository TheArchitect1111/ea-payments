# TB3 Universal Brick Tracking Auto-Wire

Feature branch: `fix/tb3-brick-auto-wire-current`, based on the latest protected production `master`. No production changes.

| TB3 brick / option | Customer-facing path | Tracking entry | Payment / confirmation contract |
| --- | --- | --- | --- |
| Public booking and partnership form | `/tarris/book` → `/api/opportunities/create` | `registerTb3Event` → `registerBrickEvent` | Inquiry only, no paid confirmation |
| HQ manual opportunity form | Same booking API with authenticated manual mode | Same registrar | Opportunity status managed separately |
| Calendar and bookings | `/api/calendar/events` | Registrar uses durable calendar event ID | Date saved is not proof of payment |
| Academics, workouts, clinics | `/api/activity/log` | Registrar uses log request ID | Training activity, not a paid class enrollment |
| Bonfire merch webhook | `/api/tb3/bonfire/webhook` (production disabled until provider contract verified) | Registrar checkout + verified payment pair, only after valid provider signature and Billing reconciliation | Signed and paid provider event is required for payment confirmation |
| Seller-attested merchandise CSV | `/api/bricks/bonfire-csv-import` | Registrar checkout event `seller_attested_paid` (unverified tracking status) | No provider-verified paid confirmation from CSV alone |
| Direct website checkout | Bonfire-hosted/external, not an EA hosted checkout | No EA checkout transaction API exists | Future provider contract required |
| Camps/classes enrollment | No published TB3 course signup endpoint found in this deployment | `classes` supported by `registerTb3Event` when added | Future enrollment must supply ID and verified payment evidence before paid letter |
| Confirmation letters | Existing booking form displays inquiry acknowledgment | Paid letters remain prohibited on raw form submit | Verified provider handler only |

## Universal contract
`lib/services/brickRegistrar.ts` is the only sender to `lib/services/trackingPortal.ts`. Every event identifies its tenant (`client_id=tarris`), stable transaction (`registration_id`), brick, buyer/contact, state and test flag. Test events use a separate durable test record, never a live registration. A customer-specific booking ID means one customer may book twice without overwriting the first transaction.

The registrar centrally queues failed live signup tracking rather than falsely saying a saved calendar/booking failed. Payment verification events cannot be confirmed without trusted server-side proof and matching tenant, registration, offer, email and reference.

## Preview $1 fixture
`POST /api/tarris/brick-dollar-test` requires `VERCEL_ENV=preview`, `TB3_BRICK_TEST_KEY` and header `x-tb3-test-key`. Body: `{ "testId":"preview123456", "brick_type":"payments", "email":"tester@example.com", "name":"Preview Tester" }`.
The fixture simulates one $1 provider verification and writes **only** to segregated `is_test=true` tracking storage, not Stripe or Bonfire and not TB3's real order ledger. On production, GET and POST must both return 404. Use a distinct `testId` for a fresh simulated registration.

## Scope boundary
No live Stripe test key, actual payment, payout, email letter, third-party Bonfire order event or TB3 production data was required or executed. Actual class checkout and provider confirmation must be implemented when those options are offered.
