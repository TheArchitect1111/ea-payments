# Tasks: [TITLE]

## Preparation

- [ ] T001 Confirm source of truth and affected tenant/project.
- [ ] T002 Confirm constitution gates and protected invariants.
- [ ] T003 Confirm rollback path and production verification method.

## Implementation

- [ ] T010 Implement the smallest safe change set.
- [ ] T011 Run repository-specific build, lint, type, unit, and integration checks that apply.
- [ ] T012 Review changed files for unauthorized content, asset, security, tenancy, billing, auth, or legal regressions.

## Production verification

- [ ] T020 Verify deployed route resolves successfully.
- [ ] T021 Verify critical interactions and state transitions.
- [ ] T022 Verify visual/content acceptance criteria, including asset presence and duplicate-image checks where applicable.
- [ ] T023 Verify mobile behavior where applicable.
- [ ] T024 Record deployment/commit identifier and production evidence.

## Convergence

- [ ] T030 Compare every acceptance criterion against production evidence.
- [ ] T031 Append corrective tasks for every failed criterion.
- [ ] T032 Repeat implementation and verification until all criteria pass or rollback/blocker criteria are reached.

## Completion

- [ ] T040 Confirm no unresolved high-severity regression remains.
- [ ] T041 Mark complete only after production proof passes.