# Amanda Catherine V3: Final blocked-fix acceptance

**Decision: BLOCKED for unconditional production approval.** Production remains protected. No design, entitlements, Square configuration, Jane integration, or dependencies were changed.

## Required code fixes

- **Classes route: PASS.** Replaced obsolete secondary `View Classes` href `/portal/amanda-catherine/classes` with same-page `#classes-grid`. Existing header Classes anchor and deleted standalone Classes page remain unchanged. Playwright click and screenshot pass: https://github.com/TheArchitect1111/ea-payments/actions/runs/39033783118 .
- **Airtable-driven availability: IMPLEMENTED, source-to-CTA rule PASS.** Removed `HARDCODED_AVAILABLE`, `HARDCODED_INQUIRY`, and `getStatusFromHardcode` from the registry. Read `Payload JSON.status` for every Creative Studio class. Normalize existing Airtable terms `NOT READY` to Waitlist and `READY` to Available. The CTA policy maps `INQUIRY` to Request Info with existing contact destination. No class- or price-specific overrides.
- **Independent Airtable reconciliation: UNVERIFIED.** The connected Airtable account does not list the actual Creative Studio source base. Source-to-CTA logic and live rendering were tested, but authoritative row-by-row comparison of raw Airtable records to page output remains unavailable. This must not be labeled full reconciliation PASS.

## Six-gap rerun

| Evidence gap | Result |
|---|---|
| 1. Nav crawl | **PASS: 46 unique destinations, zero internal 404s**. External RIMAN and WAAC pages returned HTTP 403 to the automated browser; manual check deferred |
| 2. Airtable direct reconciliation | **BLOCKED for independent raw row verification**; direct-source class status implementation and UI rendering PASS |
| 3. Checkout | **PASS for routing only**: Wood Therapy Square HTTP 200, CAD 997 shown by site, no payment; independent Square-side amount not confirmed |
| 4. Request Info and Jane | **PASS for routing**: Starter Kit Request Info HTTP 200, Jane HTTP 200; no submission/booking |
| 5. Safe form submissions | **DEFERRED** pending verified non-notifying Preview test mode/owner-supervised run |
| 6. Shared client | **PARTIAL PASS**: TB3 public homepage HTTP 200, not a full shared-component regression |

Evidence: https://github.com/TheArchitect1111/ea-payments/actions/runs/39033958937 ; https://github.com/TheArchitect1111/ea-payments/actions/runs/39033783118 .

## Original 15-point acceptance status

1. Homepage desktop/mobile: PASS from earlier four-width tests.
2. Navigation: PASS internal routes; external bot-blocked pages deferred manual confirmation.
3. Classes anchor: PASS both header and View Classes; standalone 404 is intentionally deleted, no remaining link.
4. Airtable availability: source-derived mapping PASS; independent raw-table reconciliation BLOCKED.
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

## Unresolved release decision

**BLOCKED**, not READY FOR APPROVAL: need independent read-only Airtable Creative Studio row access to validate field-by-field status and prices, or owner-authorized acceptance of source-to-CTA code evidence in place of raw reconciliation; non-notifying form proof or explicit approved deferral; and appropriate broader EA shared-client test. No production promotion occurs without explicit authorization.
