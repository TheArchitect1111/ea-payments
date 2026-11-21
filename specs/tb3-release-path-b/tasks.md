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
- [x] T014 Re-ran focused commerce, security, tenancy, chassis, client-bundle and build checks. TB3-scoped type diagnostics and all changed-path diagnostics are zero; the remaining repository-wide diagnostics are recorded below.
- [x] T015 Reviewed the corrective source diff, catalog invariants, provider boundaries, disabled checkout, changed-file set and direct-parent requirement.
- [x] T016 Save exact-SHA evidence after the local corrective commit.
- [x] T017 Removed hardcoded demo-password fallbacks, enforced server-only credential/data modules and added a production client-asset secret scan to local and CI release gates.
- [x] T018 Fixed Windows path normalization in the chassis guard while retaining its existing exclusions and bypass detection.
- [x] T019 Fixed the shared chassis runner's adapter identity/type boundary; runtime contract verification remains fail-closed.

## Production verification

- [x] T020 No Preview or Production deployment was performed.
- [x] T021 No payment/provider request, Printful order, database migration, checkout activation or transaction was performed.

## Completion

- [x] T040 Confirmed offline certification results and remaining external blockers below.
- [x] T041 Report this as local implementation only; it is not deployed, Production verified, or launch-ready.

## Certification findings

- PASS: TB3 commerce/HQ/PayPal/Printful offline suite (72/72), shared chassis/TB3 autowire (21/21), Tarris and Amanda contract modes (14/14 each, not live), host routing, 14-product/82-variant storefront contract, tenant safety, Production protection (3 profiles / 13 contracts), exact-source release guard, Windows chassis guard and self-test, Simplifi hardening (16/16), Website + Portal Starter, production build, client-secret scan (190 assets / 0 hits), UXG trace (706 traces / 0 forbidden runtime files), and TB3-scoped typecheck (0 TB3 diagnostics).
- FAIL: repository-wide TypeScript check remains at 376 unrelated diagnostics; zero diagnostics remain in changed TypeScript files. The separate CTP workspace contract script still has two pre-existing path/behavior assertion failures and aborts on missing `lib/provisioning-engine/steps.ts`; those unrelated EA behaviors/files were not changed.
- PASS: built client assets contain no known demo fallback password, server-only credential environment read, PayPal/Printful credential reference, or Vercel bypass credential reference. User-facing configuration guidance may name secret variables.
- Checkout remains disabled and all 14 products / 82 variants remain Coming Soon with unverified fulfillment mappings.
