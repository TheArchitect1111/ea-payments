# Implementation Plan: TB3 Path B Local Release Safety

## Constitution check

- Approved intent: use the committed commerce candidate as foundation while applying only verified recovery protections.
- Source of truth: commerce SHA `f8c1a036aac47a8f76c595117bf994c86d1c0b10`; comparison checkpoint `07204b603a760e6c947c02ea4d08186ddda6a4f1`.
- Protected invariants: PayPal payment, Printful-only TB3 fulfillment, all catalog entries/prices preserved, all mappings unverified and Coming Soon, checkout disabled, `tarris` tenant scope, authenticated HQ, shared tenants preserved.
- Rollback: revert only the local corrective commit; no remote state is touched.
- Verification: focused offline commerce/security/chassis tests, exact-SHA gate fixture tests, TypeScript/build only when dependencies are available. Production verification is intentionally not part of this local task.
- Visual scope: no page/component styling or asset changes; storefront assertion follows current approved CTA and Coming Soon behavior.

## Architecture

Keep the committed PayPal/Printful/catalog/cart/webhook/ledger/HQ graph intact. Port the recovery's fail-closed chassis adapter implementations. Correct TB3 host and storefront contracts for actual committed behavior. Replace a historical single-candidate-pinned master-guard test with deterministic temporary-repository fixtures that verify exact-source and manifest-only behavior. Adopt the recovery's production-gate workflow so Preview proof is source-bound and required before promotion. Keep demo credentials and data access server-only, scan built client assets, and make the chassis guard's path exceptions work on Windows without relaxing its rule set.

## Execution sequence

1. Create an isolated local checkout at the exact commerce SHA; leave the original dirty ledger-diagnostic working file untouched.
2. Compare tenant/auth, provider, checkout, HQ and production gate sources against recovery; retain the commerce versions where behavior already matches.
3. Make each adapter/test/workflow correction individually and review its diff.
4. Remove known fallback passwords from browser-reachable modules and enforce server-only data boundaries; scan production client assets for known credential literals and server-only credential reads.
5. Normalize the chassis guard's repository paths and test both bypass detection and canonical Windows exclusions.
6. Run focused tests and inspect any failures before changing implementation.
7. Run relevant TypeScript/build checks offline; record pre-existing or unrelated failures accurately.
8. Review the complete diff, parent SHA, catalog counts/prices/status, provider imports and disabled checkout before the local commit.
9. Save SHA-bound certification evidence and the exact-source Preview package.

## Risk and rollback

Risks are accidental checkout enablement, unverified mapping acceptance, tenant/auth drift, stale-source promotion proof, accidental provider calls, or shared chassis false-live outcomes. Any such change blocks the commit. Rollback is a local revert of the corrective commit; do not modify or deploy the original source/recovery worktrees.

## Production proof

Not performed or claimed here. Any Preview deployment, Vercel/GitHub state change, database change, provider request, checkout activation or transaction requires its own authorization and must verify the deployed exact source before Production approval.
