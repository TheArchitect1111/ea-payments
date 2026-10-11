# Feature Specification: Calendar, People and Discovery install certification

**Request:** Certify the three blocked bricks, add guarded provisioning tests and install proof, push fix/blockers-certified.
**Project:** EA reusable chassis on master 3e7e1f85.
**Status:** Implementation

## Intent and source of truth
Use config/capability-inventory.json and module-certification-contract.json as authority. Amanda's durable signup, same-row update, tracking and confirmation are the reference lifecycle. These three modules do not collect payment; no dollar charge is applicable.

## Scope
Calendar: durable tenant calendar, optional Nylas mapping, authenticated list/create. People: preserve Postgres SoR and flags, validate install readiness, guarded directory UI. Discovery: durable tenant assessment, analysis, tracking and confirmation, preserving public /assessment redirect and existing CTP flow.

## Protected invariants
No master merge or production promotion. No changes to Amanda/TB3 routes, records, pricing, or assets. SECURITY-MODEL.md remains binding. Memory is not durable proof. No external provider connection is invented. All test endpoints return 404 in production before authentication or writes.

## Acceptance criteria
1. Selecting each certified module invokes its installer and independently reads durable install proof.
2. Actual admitted entitlements remain authoritative; provider failures prevent installed state.
3. Calendar event and Discovery submission replay retain the same ID. People identity upsert retains Postgres uniqueness.
4. Unauthorized, wrong tenant, missing membership, disabled modules and invalid input fail closed.
5. Discovery records submission/update tracking and sends confirmation once on sequential replay.
6. Ten evidence classes reference executable tests and exact source fingerprints.
7. npm tests, build, security and certification checks pass; branch push is independently verified.

## Verification and rollback
Isolated integration tests use actual services with controlled durable/provider ports. Preview provisioning routes are admin-only and target cert-* tenants. Runtime live-provider proof is recorded separately, never inferred from isolated tests. On missing providers, stop installation before tenant writes. Rollback is discarding the branch. Production deployment requires a later explicit merge.
