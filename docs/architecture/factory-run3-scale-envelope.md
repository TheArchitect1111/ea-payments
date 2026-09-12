# EA Factory Run 3 — Scale Envelope Certification

Date: 2026-09-12

## Objective
Prove the Run 0–2 Factory can move from torture-test confidence to repeatable mass-production capacity without weakening tenant isolation, idempotency, bounded recovery, or fail-closed delivery.

## Certified envelope
- 50 synthetic tenants.
- 5 product types per tenant: website, portal, learning, knowledge/content, report.
- 250 WorkOrders in one certification wave.
- The same retryable and permanent failure classes proven in Run 2 remain active.
- Zero external production writes.

## Acceptance rules
1. Exactly 250 WorkOrders are attempted.
2. Every healthy tenant completes all five product types.
3. Retryable failure recovers within the bounded retry budget.
4. Permanent failure blast radius remains one WorkOrder only.
5. Artifact IDs remain collision-free across the wave.
6. Tenant/project lineage remains isolated.
7. Duplicate append remains idempotent.
8. Every successful build retains its Execution Contract and mandatory review gates.
9. Delivery remains fail-closed pending verification.
10. The certification must not publish or write external production data.

## Why Run 3 exists
Run 2 proved adversarial correctness at 12 tenants / 60 WorkOrders. Run 3 raises the same contracts to a larger deterministic production envelope so throughput growth does not silently trade away safety.
