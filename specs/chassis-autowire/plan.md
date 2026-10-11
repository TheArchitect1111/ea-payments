# Implementation Plan: Chassis autowire

## Constitution check
Approved intent and authoritative registry identified. Preserve existing Amanda, auth, tenant identity and certified gates. No visual replacement. Rollback: revert isolated branch. Production verification: read-only baseline; no production deployment authorized.

## Architecture
Pure manifest-to-certified-plan resolver; exact entitlement writer with durable read-back; installation journal preserved on backfill; composite brick registry and tenant-scoped Amanda adapter; existing admin enable paths use certified admission.

## Execution sequence
1. Trace selection and writes.
2. Implement exact plan handoff and portable install/registration adapter.
3. Integration and regression tests, type/build review.
4. Save evidence, push branch, verify remote source; no merge.
