# Implementation Plan: Amanda V2 client updates

## Constitution check
Approved intent, sources, security constraints, visual invariants and rollback captured in spec.md. User prohibits production: all deployment evidence applies to Preview, not production.

## Architecture
Add page-only offering/proof components and styles. Use existing Stripe service with a server-owned kit catalog, noindex purchase page, paid-session verification and separate physical-order persistence. Add narrowly scoped kit webhook dispatch without altering existing course/subscription handling. No portal view edits.

## Execution sequence
1. Search and inspect supplied screenshots and existing client material.
2. Add source-grounded content and commerce; preserve baseline.
3. Run relevant static and commerce/learning checks.
4. Deploy existing integration branch to Preview only.
5. Verify page, CTA destinations, desktop/mobile, kit checkout and protected invariants; converge on defects.

## Risk and rollback
External social login/Google restrictions may limit destination inspection. Preview commerce credentials may be unavailable. Do not bypass protections or misstate success. Roll back this pass to d7639b9 if a blocking regression remains.
