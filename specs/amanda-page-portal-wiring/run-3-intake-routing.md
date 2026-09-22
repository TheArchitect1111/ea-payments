# Amanda Catherine public CTA intake wiring: Run 3

Date: 2026-09-19 UTC

Branch: `integration/amanda-page-portal-wiring-20260919`

## Intent

Complete the application communication loop without changing the approved public page or frozen Portal V2 visual system.

## Scope

- Route each application activity event to its matching protected owner queue.
- Emit exactly one owner activity event per submission.
- Surface active application counts on Amanda's protected owner dashboard.
- Return and render workflow-specific applicant confirmations.
- Show status-specific post-review handoff guidance in each protected queue.

## Protected invariants

- Production remains untouched.
- Public design, copy, navigation, imagery and financing remain unchanged.
- Owner routes remain staff-protected and tenant-scoped.
- No booking, availability, acceptance or payment is promised by a confirmation.
- Frozen Portal V2 styling and navigation remain unchanged.

## Acceptance criteria

1. Founder Advisory activity links to `owner/advisory`.
2. Speaking activity links to `owner/speaking`.
3. LIFELINE interview and LIFELINE partnership activity link to `owner/lifeline`.
4. One submission invokes the notification dispatcher exactly once.
5. Applicant success copy identifies the selected workflow and its review step.
6. Amanda's owner dashboard shows active queue counts using durable submissions.
7. Queue records show the correct next handoff and an applicant email action.
8. Run 0 through Run 3 regression checks and the Next.js build pass.

## Rollback condition

Any duplicate activity, cross-tenant exposure, broken public submission, failed protected owner build or approved-page regression blocks the preview. Roll back to Run 2 commit `6571edb03dfa572b923c8de3fd1e3cee4038fe9a`.

## Run 4 boundary

Run 4 owns safe preview submissions, durable-storage proof, authenticated owner verification, responsive browser review and final regression evidence.
