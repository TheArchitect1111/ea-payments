# Implementation Plan: Amanda workflow repair

## Constitution check
Approved intent, protected invariants, security boundaries, rollback and production proof are defined in spec.md. Preserve visual fidelity.

## Architecture
Repair public proxy path separately. Restrict core changes to Amanda enrollment, access provisioning and public application integration. Reuse current durable People adapter; do not enable global flags or synthetic tenant authorization.

## Execution sequence
1. Trace reproduced owner redirect and inspect authoritative sources.
2. Repair course selection and return URLs.
3. Correct secure welcome delivery and connect application identity where supported.
4. Run relevant checks and review scoped diff.
5. Prepare draft PR; record preview and production verification gaps.
6. Converge on failures without manufacturing course content or evidence.

## Risk and rollback
Merge is blocked by auth/payment regression or unproven checkout. Revert scoped commits. Production unchanged during preparation.

## Production proof
Pending preview credentials/test payments and complete course delivery evidence.
