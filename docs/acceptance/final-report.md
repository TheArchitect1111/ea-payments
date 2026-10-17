# Amanda Catherine V3 final production acceptance: six-gap closure

**Final decision: BLOCKED. No production promotion authorized or performed.**

Protected production commits verified at start of gap closure:
- `TheArchitect1111/ea-payments`: `377ca9f399832c0379383e2579ba61fe528e6766`
- `TheArchitect1111/amanda-catherine`: `652a776f320956137bc3c9181249824414c376bc`
- Both rollback tags: `pre-premium-upgrade-2026-10-17`, matching each corresponding protected production SHA.

Read-only test evidence: [Gap closure Playwright run](https://github.com/TheArchitect1111/ea-payments/actions/runs/39032849185), [prior public acceptance: 19/19](https://github.com/TheArchitect1111/ea-payments/actions/runs/39032528486). Verified Preview: https://amanda-catherine-4-qx1ohawcv-the-architects-projects-cc813778.vercel.app . Outdated supplied Preview `ptzzjhwpa` does not contain approved newer nav and must not be approved.

## Six evidence gaps

1. **Full nav crawl: FAIL.** One internal 404: `View Classes` to the intentionally deleted `/portal/amanda-catherine/classes`. See `nav-crawl.json`. External 403/429 indicate bot restrictions rather than verified failures; one PDF request timed out.
2. **Airtable reconciliation: BLOCKED.** Read-only Airtable connector did not expose the matching Creative Studio source table. More importantly, registry uses hardcoded effective availability over raw Airtable field; owner-policy and data-source precedence require explicit resolution. See `airtable-reconciliation.md`.
3. **Checkout routing: PARTIAL.** Wood Therapy Square checkout HTTP 200, Advanced Body Sculpt waitlist HTTP 200. Product amount was not independently confirmed at Square; Request Info is not a currently rendered class state. See `checkout-routing.md`.
4. **Request Info + Jane: PARTIAL.** No class Request Info action exposed. Jane URL retained and HTTP 200; no booking.
5. **Safe form proof: DEFERRED for safety.** Existing waitlist endpoint and form are present, but no preview-only `FORM_TEST_MODE` was verified and the production-notification side effects have not been isolated. Do not submit test data until owner-supervised non-notifying mode is proven.
6. **Shared-client smoke: PARTIAL PASS.** TB3 public homepage HTTP 200. This does not prove absence of shared-component regression or compare its baseline.

## Fifteen acceptance criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Homepage desktop/mobile | PASS (previous four-width and full acceptance) |
| 2 | All navigation destinations | FAIL: internal 404, external unverified |
| 3 | Classes approved same-page navigation | PASS for header Classes link; secondary View Classes link FAIL |
| 4 | Class availability vs Airtable | BLOCKED: direct row reconciliation and override policy |
| 5 | Buy Now route | PARTIAL: correct configured Square URL and HTTP 200; Square price not independently matched |
| 6 | Waitlist route | PASS, no submission |
| 7 | Request Info | DEFERRED: no rendered class Request Info state |
| 8 | Jane booking URL | PASS HTTP 200, no booking |
| 9 | Existing form submission | DEFERRED with notification risk; owner-supervised preview test required |
| 10 | Owner and student portal login entry | PASS unauthenticated route checks |
| 11 | Responsive widths | PASS (375/768/1024/1440) |
| 12 | Approved content inventory | PARTIAL: major sections reviewed, not fully reconciled |
| 13 | No broken routes | FAIL: View Classes 404 |
| 14 | Shared EA regression | PARTIAL: TB3 public smoke only |
| 15 | Production unchanged | PASS at start; recheck prior to promotion |

## Required remediation before READY FOR APPROVAL

Correct the broken secondary View Classes destination while preserving header same-page behavior and keeping the deleted route deleted; confirm Airtable source-of-truth precedence with owner; obtain independent Square price proof; either test forms in verified non-notifying preview environment or secure approved deferral; extend shared-client regression beyond a public 200; then rerun acceptance and verify both production SHAs. **No design changes are authorized by this gap-closure task.**
