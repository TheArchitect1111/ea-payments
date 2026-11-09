# Implementation Plan: TB3 Commerce Reporting and Fulfillment Safety

## Constitution check

- Approved intent and authoritative source identified: production base plus preserved PayPal certification manifest.
- Protected invariants: Coming Soon, disabled checkout/Printful, tenant isolation, existing RLS/idempotency, unrelated client and deposit paths untouched.
- Rollback: discard this isolated development branch changes; production branch remains unchanged.
- Production verification is defined but intentionally not run without deployment approval.
- Affected HQ report UI stays responsive through existing portal layout; preserve existing public assets.

## Architecture

Keep public card manifest focused on Coming Soon presentation. Preserve Printful catalog mappings in a server-only manifest consumed by cart resolution and validation. Add a viewer-authorized read-only HQ endpoint that lists the Tarris PayPal ledger and enriches known Printful IDs with safe shipment status/tracking fields. Never use Stripe or Bonfire for merchandise reporting. Enforce disabled commerce before any Printful mutation.

## Execution sequence

1. Remove TB3 Bonfire routes/data helpers and Fourthwall links; preserve Coming Soon UI.
2. Add static server-side Printful catalog mapping and strict mapping validator.
3. Extend ledger read adapter and add Tarris HQ report handler/UI.
4. Add refund/reconciliation fields and fail-closed Printful mutations, preserving payment idempotency.
5. Run focused offline tests, dependency type diagnostics, and final diff audit.
6. Do not deploy. Preview acceptance is a separate authorized step.

## Risk and rollback

- Risks: changing catalog file boundaries, reporting mapping mismatch, external Printful status shape variation.
- Rollback trigger: authorization failure, tenant leak, active checkout, or any mutation while disabled.
- Rollback method: revert only this isolated branch's uncommitted TB3 commerce changes; production base remains untouched.

## Production proof

Not available in this task by explicit restriction. The deliverable is a Preview candidate only, subject to real Preview/provider catalog/webhook checks after approval.
