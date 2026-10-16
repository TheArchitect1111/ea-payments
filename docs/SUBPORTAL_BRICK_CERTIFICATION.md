# EA LEGO Subportal Brick, certification ledger

**Release:** v1
**Scope:** Generic Subportal Brick. No organization, course, slug or person is hardcoded into the brick.
**Branch:** feature/subportal-brick-20261016
**PR:** https://github.com/TheArchitect1111/ea-payments/pull/576
**Status:** NOT CERTIFIED. Deploy preview only. Do not merge into production until all gates show real proof.

Certification is fail closed: \`src/chassis/adapters/subportal.adapter.ts\` refuses \`.attach()\` and reports \`.health().status=503\` if the \`subportal_certifications\` row for v1 does not contain all 20 true live gates and real required provider/database health checks.

## 20 release gates

| # | Gate | Result, October 16, 2026 | Required evidence |
|---|------|--------------------------|-------------------|
| 01 | Client-agnostic brick source, no customer-specific code | Implemented, audit pending | Static CI scan |
| 02 | Install manifest resolves organization/brand/offer, rejects duplicate offer IDs | PASS unit | Generic contract test |
| 03 | CAD price contract resolves from durable manifest | Implemented, live pending | Runtime manifest read |
| 04 | Four chassis sockets return typed values, no mock proof | Implemented, live pending | Provider-backed interface run |
| 05 | Health 200/503 checks live database and provider, refuses uncertified | Implemented, live pending | Health endpoint evidence |
| 06 | Stripe session is genuinely created for a mapped CAD offer | PENDING | Stripe checkout ID and provider log |
| 07 | Stripe signed paid webhook provisions enrollment | PENDING | Signed event, payment intent and persisted enrollment |
| 08 | Square online checkout is genuinely created for a mapped offer | PENDING | Square order/payment link |
| 09 | Square signed paid webhook verifies order, catalog variation, CAD amount and location | PENDING | Square payment ID, catalog/amount checks |
| 10 | Unmapped Square catalog item is rejected | PASS unit, live pending | Unit and webhook denial |
| 11 | Replayed payment is idempotent and creates no duplicate enrollment/portal | PASS database uniqueness; provider replay pending | SQL unique violation and repeated webhook |
| 12 | Second purchase adds an enrollment to same UUID, multiple organizations supported | PASS database authorization; provider case pending | SQL cross-org test and real second purchase |
| 13 | Opaque /portal/[orgSlug]/students/[studentId] path, no route collisions | Implemented, preview smoke pending | Preview route checks |
| 14 | Clerk native third-party JWT authenticated with Supabase, never EA HMAC | PENDING | Real Clerk verified session, JWT Supabase 200 |
| 15 | Student RLS rejects cross-student/tenant reads and writes | PASS 5+ live policy checks | Live Supabase SQL role simulation, rollback |
| 16 | Owner RLS isolates each organization | PASS 2 live policy checks | Live Supabase SQL role simulation, rollback |
| 17 | Student progress saved and organization boundaries preserved | PASS 2 live policy checks | Live Supabase SQL update, rollback |
| 18 | Real Resend message ID and signed delivered webhook proof persisted | PENDING | Resend email ID, signed event ID, delivered_at, delivery_status |
| 19 | Actual PDF receipt generated, stored, available only to entitled user | PASS PDF bytes unit; authenticated access pending | PDF checksum, provider-linked receipt and authorized GET |
| 20 | Existing client routes, CTAs, auth, checkout unaffected | PENDING | Regression suite and preview/live comparisons |

**Real database validation, October 16, 2026:** Supabase project \`dwygvwnjjaennksddniu\`, migration \`20261016134137_subportal_brick_v1\` applied. All seven new Subportal public tables show RLS enabled. Thirteen live PostgreSQL assertions succeeded across two test transactions and both transactions were rolled back: a student cannot read another student's enrollment, progress or identity, cannot read a second tenant, cannot edit a second student's progress; owner sees only that organization's enrollment/progress; a stranger sees nothing; one student can have enrollments in two organizations; authorized student updates their own progress and not the other organization's progress; replay uniqueness is enforced. These are actual RLS evaluations using \`SET LOCAL ROLE authenticated\` with test JWT claims. They **do not** replace an end-to-end Clerk bearer-token test.

**Build evidence:** https://github.com/TheArchitect1111/ea-payments/actions
**Preview deployments:** https://vercel.com/the-architects-projects-cc813778/ea-payments
**Schema:** supabase/migrations/20261016134137_subportal_brick_v1.sql
**Unit tests:** tests/subportal-brick-contract.test.mts

## Shared provider endpoints

Each provider uses one platform-wide endpoint for every installed organization: Stripe `/api/webhooks/subportal/stripe`, Square `/api/webhooks/subportal/square`, and Resend `/api/webhooks/subportal/resend`. Provider identity is resolved from the verified event and installed manifest; no per-tenant webhook function is required. Stripe uses the endpoint-specific `SUBPORTAL_STRIPE_WEBHOOK_SECRET`. The legacy `/api/webhooks/stripe` source is kept byte-for-byte identical to the base branch because it is covered by the existing exact-source certification.

The Preview deployment currently needs Clerk authentication configured before its student routes can run. A fail-closed middleware guard returns an uncached 503 when either Clerk key is absent; it never falls back to an EA HMAC token. This condition is deployment configuration, not a certification pass.

## Release blockers and non-drift rules

1. Need real third-party Clerk JWT accepted by Supabase. This requires both Clerk Supabase integration and Supabase provider configuration. See https://supabase.com/docs/guides/auth/third-party/clerk
2. No provider-funded Stripe/Square payment or live Square signed webhook evidence has been generated in this branch. **Never invent live payment IDs or mark simulated checkout as proof.**
3. Delivery needs an actual Resend message ID plus persisted PDF/receipt; a PDF unit test is not email delivery.
4. The existing repository has CI baseline failures unrelated to this feature. Do not restore deleted client routes, edit client CTAs, or weaken pre-existing production gates to make this feature pass.
5. Project environment-variable listing via the connected Vercel API returned 403. The tool could not confirm third-party auth, billing credentials or provider webhook settings. No values were exposed.
6. Production promotion is prohibited until independently verified 20/20 evidence.

## Ownership and provisioning

Only a **signed, verified and paid** provider event reaches \`subportalService.create({organizationId, studentIdentity, offerId, paymentReference, idempotencyKey, provider})\`. The student UUID is immutable; an email can be linked to a Clerk principal only after verification. Idempotent enrollment keys and unique provider/payment references prevent duplicates. All tenants reuse a single shared student route and a single shared checkout/webhook implementation. Square offer catalog variation IDs come from the installed tenant manifest and must match the verified Square Order API response.

**No new LMS scope:** programs, materials links, progress, support, next requirements and Eva first login only.

## Continuation verification, October 16, 2026

- Vercel Preview environment variable metadata read was retried against project `ea-payments` and team `the-architects-projects-cc813778`: **403 forbidden**, permission to list project environment variables denied. Values of `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` remain unconfirmed. No keys were added; there is no authorized proof of their absence or presence. The current execution environment has no Vercel CLI.
- Connected Supabase project listing confirms `dwygvwnjjaennksddniu` is ACTIVE_HEALTHY, but the available connector does not expose the Authentication > Third-Party Auth toggle; **Clerk provider enabled status not verified**. Previously passing SQL role-simulation RLS checks do not establish real third-party JWT acceptance.
- Therefore Preview Clerk sign-in, real signed Stripe/Square fulfillment, Resend delivered-webhook proof, and the 20/20 release check remain **BLOCKED/UNVERIFIED**. No live webhook or email delivery event was generated in this continuation.
- Fail-closed release status is unchanged: **NOT CERTIFIED**; `.health()` remains 503 per the certification hold and `.attach()` must remain false. No customer-specific code, payment implementation, live deployment, or production branch was changed.
