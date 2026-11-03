# Stage 3 source verification

Implemented a dedicated signed Square Sandbox webhook and bearer-protected return verification. Payment is retrieved from the sandbox API and checked for completed status, CAD 100 cents, configured location, and a previously saved test order before any access or delivery action.

The isolated test flow uses the existing payment tracking, student-access profile, confirmation template, email provider, and PDF receipt generator. New student identities use secure password setup links; no plaintext password is stored. Existing roles and permanent entitlements are preserved. Test grants use the existing 72-hour expiry checks, with renewal only on a newer verified Square test payment. Stored delivery flags allow retries; repeated notifications do not repeat successful emails in sequential replay tests.

Automated tests: 3/3 pass, with actual route, fulfillment and access handlers, using mocked external Square, email and persistence transports. Covers two students, per-user welcome and CAD $1 test PDF receipt, invalid signatures/tokens, unpaid/wrong-amount/wrong-currency/wrong-location payments, replay, email retry, expired-test renewal and permanent-access preservation. Checkout configuration test passes.

Live checkout route and live Square webhook are unchanged. Production is unchanged. No real sandbox payment or inbox delivery is claimed.

Existing legacy Amanda suite: 5/6 pass; the pre-existing middleware test fails because the baseline replaced middleware with unconditional NextResponse.next(). This is a release blocker to review before deployment, not a new change in this stage. Full repository TypeScript has baseline errors; no diagnostics were reported for the new Square routes, service, tests or affected access files in the targeted scan.

Next stage: isolated deployment and real Square sandbox payment, webhook/return verification, delivered emails and student login evidence for both testers. Credentials required: SQUARE_SANDBOX_ACCESS_TOKEN, SQUARE_SANDBOX_LOCATION_ID; signed webhook additionally uses SQUARE_SANDBOX_WEBHOOK_SIGNATURE_KEY and SQUARE_SANDBOX_WEBHOOK_NOTIFICATION_URL. Never use production credentials as fallback. Release only after end-to-end verification.
