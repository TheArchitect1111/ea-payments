# Amanda Catherine V3: Final acceptance for owner approval

**Decision: READY FOR APPROVAL (with owner verification required before any promotion).** Production remains protected. No design, entitlements, Square configuration, Jane integration, or dependencies were changed.

## Required code fixes

- **Classes route: PASS.** Replaced obsolete secondary `View Classes` href `/portal/amanda-catherine/classes` with same-page `#classes-grid`. Existing header Classes anchor and deleted standalone Classes page remain unchanged. Playwright click and screenshot pass: https://github.com/TheArchitect1111/ea-payments/actions/runs/39033783118 .
- **Airtable-driven availability: IMPLEMENTED, source-to-CTA rule PASS.** Removed `HARDCODED_AVAILABLE`, `HARDCODED_INQUIRY`, and `getStatusFromHardcode` from the registry. Read `Payload JSON.status` for every Creative Studio class. Normalize existing Airtable terms `NOT READY` to Waitlist and `READY` to Available. The CTA policy maps `INQUIRY` to Request Info with existing contact destination. No class- or price-specific overrides.
- **Airtable reconciliation: PASS (code path) + OWNER VERIFICATION REQUIRED.** The connected Airtable account does not expose the Creative Studio source base for independent row reads. Source-to-CTA logic and 6/5/1 live rendering passed; raw row-by-row verification is not claimed.

## Six-gap rerun

| Evidence gap | Result |
|---|---|
| 1. Nav crawl | **PASS: 46 unique destinations, zero internal 404s**. External RIMAN and WAAC pages returned HTTP 403 to the automated browser; manual check deferred |
| 2. Airtable direct reconciliation | **PASS (code path) + OWNER VERIFICATION REQUIRED**; permissions prevent independent raw row reads |
| 3. Checkout | **PASS for routing only**: Wood Therapy Square HTTP 200, CAD 997 shown by site, no payment; independent Square-side amount not confirmed |
| 4. Request Info and Jane | **PASS for routing**: Starter Kit Request Info HTTP 200, Jane HTTP 200; no submission/booking |
| 5. Safe form submissions | **DEFERRED** pending verified non-notifying Preview test mode/owner-supervised run |
| 6. Shared client | **PARTIAL PASS**: TB3 public homepage HTTP 200, not a full shared-component regression |

Evidence: https://github.com/TheArchitect1111/ea-payments/actions/runs/39033958937 ; https://github.com/TheArchitect1111/ea-payments/actions/runs/39033783118 .

## Original 15-point acceptance status

1. Homepage desktop/mobile: PASS from earlier four-width tests.
2. Navigation: PASS internal routes; external bot-blocked pages deferred manual confirmation.
3. Classes anchor: PASS both header and View Classes; standalone 404 is intentionally deleted, no remaining link.
4. Airtable availability: **PASS - CTAs derive from Airtable, hardcoded overrides removed. Independent row read blocked by permissions, mitigated by owner visual check (required).**
5. Buy Now checkout routing: PASS for tested Square destination, no payment.
6. Join Waitlist routing: PASS.
7. Request Info routing: PASS for Starter Kit.
8. Jane booking URL: PASS HTTP 200, no booking.
9. Form submissions: DEFERRED to non-notifying owner-supervised test.
10. Portal sign-in entry screens: PASS unauthenticated tests.
11. Four-width responsive checks: PASS.
12. Approved content inventory: PARTIAL; major sections verified.
13. New internal broken routes: PASS sampled full homepage crawl, zero internal 404.
14. Shared EA component regression: PARTIAL; TB3 public smoke only.
15. Production unchanged: verify both protected production SHAs again at release gate.

## Protected rollback points

- Wrapper production and rollback: `652a776f320956137bc3c9181249824414c376bc`
- Upstream production and rollback: `377ca9f399832c0379383e2579ba61fe528e6766`
- Tag: `pre-premium-upgrade-2026-10-17` in both repos
- Branch: `premium/amanda-upgrade`
- Verified isolated wrapper Preview: https://amanda-catherine-4-ofrgdpjwq-the-architects-projects-cc813778.vercel.app

## Owner verification and release decision

**READY FOR APPROVAL (with owner verification required).** This is a documentation/readiness decision, **not owner sign-off** or permission to promote. Owner must complete the following check and approve separately:

> Code path verified: Airtable status → CTA mapping implemented and rendering 6/5/1. Direct API reconciliation blocked by Airtable permissions on connected account. Mitigation: Owner to visually confirm in Airtable that 6 classes marked AVAILABLE/READY, 5 marked NOT READY/WAITLIST, 1 marked INQUIRY matches Preview. This is a 30-second visual check, not a code risk.

The 30-second estimate is guidance, not a guarantee. Differences in individual records or prices must be resolved before promotion. Until the owner confirms, independent row-level reconciliation remains unverified.

**Accepted documented limitations for the approval review:** Safe-form submission remains deferred to avoid production notifications pending a verified non-notifying mode or owner-present test; shared-client smoke covered TB3 public homepage (HTTP 200) but not every shared component. External 403 responses may require manual checks. Checkout routing was tested without charging; Square-side price reconciliation remains limited.

**Promotion gate:** Explicit human authorization is still mandatory; recheck production SHAs and rollback tags at promotion time. No production deployment is authorized by this report.
