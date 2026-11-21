# Tasks: TB3 Path B Local Release Safety

## Preparation

- [x] T001 Confirmed committed commerce source SHA and preserved source worktree's uncommitted ledger diagnostic.
- [x] T002 Read the EA constitution, SECURITY-MODEL.md and existing TB3 commerce specification.
- [x] T003 Recorded protected invariants, offline verification, and local-only rollback boundary.

## Implementation

- [x] T010 Correct TB3 private-host routing contract without exposing private content.
- [x] T011 Correct storefront contract for Coming Soon plus the existing first-access inquiry; assert no order/capture action.
- [x] T012 Restore fail-closed shared billing/catalog/Jane adapters and offline chassis fixture adapter.
- [x] T013 Strengthen exact-source, manifest-only Production gate verification and retire a historical SHA-pinned test.
- [x] T014 Ran focused commerce, security, tenancy, chassis and build checks. TB3 scoped type diagnostics are zero; repository-wide TypeScript and the unrelated shared chassis guard remain failing and are recorded as blockers below.
- [x] T015 Reviewed the corrective source diff, catalog invariants, provider boundaries, disabled checkout, changed-file set and direct-parent requirement.
- [x] T016 Save exact-SHA evidence after the local corrective commit.

## Production verification

- [x] T020 No Preview or Production deployment was performed.
- [x] T021 No payment/provider request, Printful order, database migration, checkout activation or transaction was performed.

## Completion

- [x] T040 Confirmed offline certification results and remaining external blockers below.
- [x] T041 Report this as local implementation only; it is not deployed, Production verified, or launch-ready.

## Certification findings

- PASS: TB3 commerce/HQ/PayPal/Printful offline suite (72/72), host routing, 14-product/82-variant storefront contract, tenant safety, Production protection (3 profiles / 13 contracts), exact-source release guard, Tarris and Amanda contract runs (14/14 each), shared chassis/TB3 autowire suite (21/21), Next production build, UXG trace (706 traces; no worker or third-party crawler/browser runtime), and TB3-scoped typecheck (0 TB3 diagnostics; 17 unrelated repository dependency diagnostics).
- FAIL: repository-wide TypeScript check (387 diagnostics; 11 in the shared `src/chassis/runClickTest.ts` adapter-contract area), and `guard-brick-chassis.mjs` (four direct `trackingPortal`/Airtable references in untouched shared EA files).
- BLOCKED: client bundle contains the documented demo account fallback password and the `AIRTABLE_API_KEY` environment variable name. No PayPal, Printful, diagnostic, or Vercel bypass secret value was found. The unrelated demo flow was not changed.
- Checkout remains disabled and all 14 products / 82 variants remain Coming Soon with unverified fulfillment mappings.
