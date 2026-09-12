# EA Modular Assembly — Run 6

Date: 2026-09-12

## Objective

Advance the next commercial assembly wave after durable Run 5 evidence, certifying only capabilities that can be provisioned without unresolved licensing or operational dependencies.

## Certified in Run 6

### Simplifi

The certified boundary includes the existing EA Simplifi portal workspace, capture records, content-request visibility, and Magnifi linking. No new vendor account or per-client software license is required to provision this boundary.

The Implementation specialized module wave is now admissible for:

- Simplifi
- Amplifi
- Connect
- Member Experience
- Events
- Billing
- Settings

## Deliberately not certified

### People

People remains fail-closed. Its current portal route is hard-gated behind `isUniversalPeopleEnabled()` and returns `notFound()` while disabled. A feature-flagged shell is not sufficient evidence for universal assembly certification.

### Calendar

Calendar remains fail-closed because the current module definition names Nylas as the calendar connection layer. Run 6 does not convert that vendor relationship into a required EA assembly dependency without a separate cost/license and operational review.

### Discovery

Discovery remains fail-closed because it is currently marked demo-only in the canonical module registry.

## Run 5 prerequisite included

Run 6 also closes the missing Run 5 prerequisite: certified Starter provisioning now records durable, deterministic per-tenant assembly evidence after successful entitlement writes.

## Acceptance

Run 6 is complete only when:

1. Runs 2 through 5 remain green.
2. Simplifi is admitted with explicit cost/license approval.
3. The Implementation specialized wave assembles without rejection.
4. People, Calendar, and Discovery remain fail-closed.
5. Main CI and the dedicated Run 6 workflow pass.
6. Protection gates pass.
7. The PR is merged to authoritative `master`.
8. Master acceptance passes after merge.
