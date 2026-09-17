# Amanda Catherine V2 — Run 4 Certification

Date: 2026-09-17
Branch: `feature/amanda-portal-v2`
Production cutover: **NOT AUTHORIZED / NOT PERFORMED**

## Code/build gates passed
- Amanda owner portal V2 compiles and deploys READY on Vercel preview.
- Canonical Academy course IDs and prices are shared with the enrollment surface.
- Payment fulfillment provisions Amanda client access and course entitlements.
- Learning route exists behind portal authentication.
- Jane remains the appointment authority.
- Update Hub now creates classified governed requests and persists them through the existing Creative Studio/Airtable persistence layer when configured.
- Standard content/image requests enter the governed queue.
- Course/price requests require confirmation before mutation.
- Layout/integration/new-feature requests require EA pricing and client approval. No price is invented by the portal.
- Portal does not directly mutate production.

## Runtime certification gate
The Vercel preview is protected by Vercel Authentication. Authenticated fetch attempts to both `/portal/amanda-catherine/owner` and `/portal/amanda-catherine/enroll` are redirected to Vercel SSO before the application is reached. Therefore a physical browser transaction cannot be truthfully certified from the current automated test channel.

The remaining runtime transaction is:
1. Open protected preview with an authenticated Vercel browser session.
2. Select a canonical Academy course.
3. Run a Stripe test checkout.
4. Confirm payment fulfillment provisions the same stable course ID.
5. Sign in through `/portal/login`.
6. Confirm the purchased course is visible in `/portal/amanda-catherine/learning`.
7. Submit one harmless standard Update Hub request and verify durable queue persistence without a production mutation.
8. Verify Jane opens from Appointments.
9. Verify desktop and mobile rendering against the approved Amanda Portal V2 reference.

## Certification status
**CODE/BUILD: PASS**

**PHYSICAL AUTHENTICATED TRANSACTION: BLOCKED BY PREVIEW SSO IN CURRENT AUTOMATED CHANNEL**

Do not promote this branch to production until the physical authenticated transaction above passes.