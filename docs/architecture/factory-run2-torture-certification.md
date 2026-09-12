# EA Factory Run 2 — Torture Test + Mass-Production Certification

Date: 2026-09-12

## Objective
Prove the Run 0/1 Factory conveyor can produce multiple EA product types concurrently across multiple tenants while preserving isolation, lineage, idempotency, fail-closed delivery, and bounded failure blast radius.

## Certified load
- 12 synthetic tenants.
- 5 production types per tenant: website, portal, learning, knowledge/content, report.
- 60 WorkOrders attempted concurrently.
- Mandatory Execution Contract applied to every successful build.
- Mandatory execution-verification, asset-integrity, and visual-fidelity gates required before delivery.

## Failure injection
- Retryable portal failure injected for tenant-03 on attempt 1. Expected result: succeeds on attempt 2 with no duplicate artifacts.
- Permanent report failure injected for tenant-07. Expected result: only that WorkOrder fails. Other tenant-07 products and every healthy tenant remain unaffected.

## Acceptance rules
1. All healthy tenants complete all five product types.
2. Retryable failure recovers within the bounded retry budget.
3. Permanent failure blast radius is one WorkOrder only.
4. No artifact may cross project/tenant boundaries.
5. Production artifact IDs must be globally unique across the run.
6. Re-appending the same builder output must append zero new artifacts.
7. Successful builds must emit the expected product artifact, deliverable, Execution Contract and mandatory gates.
8. Delivery must remain blocked pending mandatory verification.
9. The torture harness must never publish or touch external production data.

## Safety
Run 2 is a synthetic, side-effect-free certification. It exercises the actual production builders and contracts in memory, then relies on the existing repository CI, security, release, recovery, browser-smoke, and live-customer checks before merge and production promotion.