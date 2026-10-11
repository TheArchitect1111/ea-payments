# Implementation Plan: Amanda public-to-HQ wiring

## Constitution check
Approved request, authoritative source, protected invariants, rollback targets and public/private verification are specified in spec.md.

## Architecture
Add a separate anonymous interaction event variant to the canonical registrar, an Amanda adapter, normalized CTA keys and delegated client capture. Keep lead/payment validation intact. Correct existing form metadata and public checkout handoffs; add protected sales/setup surfaces. Correct only the Amanda wrapper's routing configuration.

## Execution sequence
1. Implement and test canonical analytics and all CTA coverage.
2. Repair navigation/aliases and application queue contracts.
3. Repair verified payment handoffs, HQ Sales and billing setup.
4. Review changes; run tests/build and preview certification.
5. Release via existing production gate and verify both hosts.

## Risk and rollback
Cross-client registrar regressions, tracking duplication, payment/access ordering and wrapper proxy loops are primary risks. Existing registrar/tenant tests and deterministic event IDs guard them. Use the verified previous deployment IDs from spec.md for rollback if needed.
