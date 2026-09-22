# Amanda Catherine public CTA intake wiring: Run 4

Date: 2026-09-19 UTC

Branch: `integration/amanda-page-portal-wiring-20260919`

## Intent

Certify the complete preview-only application journey from public CTA through durable storage, owner routing and protected status management.

## Acceptance criteria

1. All four public CTA routes load without sign-in and preselect the correct workflow.
2. Safe synthetic preview submissions return their form-specific confirmations.
3. Amanda applications fail visibly when durable storage is unavailable or a durable write fails.
4. Required upload workflows reject missing, unsupported or unfinalized uploads.
5. Saved submissions retain their workflow ID, LIFELINE program scope and submitted status.
6. Owner queues remain private, tenant-scoped and staff-protected.
7. Status mutations reject unauthenticated requests and accept only the four approved statuses.
8. Desktop and mobile public forms render without overflow or application-origin console errors.
9. Run 0 through Run 4 tests, parity, checkout, enrollment handoff and the Vercel build pass.

## Protected invariants

- Production and the frozen Portal V2 baseline remain untouched.
- Approved public design, copy, navigation, imagery and financing remain unchanged.
- No synthetic verification submission represents a real applicant.
- No confirmation promises booking, availability, acceptance or payment.

## Rollback

Any failed durable write, cross-tenant exposure, broken public form, protected-route regression or build failure blocks certification. Roll back to Run 3 commit `fdeb22abf232b5be4c742eee629b921b317f6bac`.
