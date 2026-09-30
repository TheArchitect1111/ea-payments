# Feature Specification: Amanda workflow repair

**Request:** Proceed with complete enrollment and application workflow updates. No drift or other changes.
**Project/tenant:** Amanda Catherine
**Status:** Implementation; certification pending

## Intent
Public course and application CTAs must open the intended workflow rather than Amanda's owner portal. Paid learners authenticate into Learning.

## Scope
Enrollment selection, checkout return, access email, application identity and owner queues. Preserve approved courses, prices, assets, and forms. No unrelated tenants or production deployment in this branch.

## Source of truth
User's reproduced owner redirects; Amanda public routing PR #9; existing Amanda config, application-routing, Stripe fulfillment and Learning implementation; recovered Body Sculpt course outline and LIFELINE partnership kit.

## Protected invariants
SECURITY-MODEL.md remains binding. Preserve owner authorization, tenant boundaries, Stripe payment verification, approved design/content/pricing and existing assignments. Never create or email plaintext passwords. Do not invent release schedules, missing lessons, assessment answers, or partnership charges.

## Acceptance criteria
1. Public portal routes preserve path and course/form/program parameters.
2. Every supported course query selects that course; cancelled checkout preserves it.
3. Verified purchase goes to Learning with enrolled/welcome parameters; authentication preserves it for every role.
4. Applications remain public, durable, route to intended owner queue and link a tenant-scoped person when durable People is configured.
5. Purchase, entitlement, authenticated course access and first lesson are proven with non-admin accounts for all four courses before certification.
6. No unauthorized content or visual changes; mobile and desktop remain usable.

## Verification plan
Amanda repository checks, behavior tests for selection/return paths, scoped lint/type checks, preview CTA checks, test-mode Stripe and durable record proof. Owner application/People checks require authenticated preview access.

## Rollback condition
Any tenant/auth/payment regression blocks merge. Revert only the two scoped repair branches if deployed verification fails.

## Completion evidence
Production unchanged. Do not label READY until all four test payments and Learning launches are proven. Missing materials and unapproved release/assessment rules remain blockers.
