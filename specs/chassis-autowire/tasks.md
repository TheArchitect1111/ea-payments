# Tasks: Chassis autowire

## Preparation
- [x] Confirm baseline master and source of truth.
- [x] Read constitution/security model and define protected invariants.
- [x] Define branch-only rollback and verification boundary.

## Implementation
- [x] Pass exact certified admitted selection to entitlement writer and tenant install.
- [x] Preserve selection on package backfill and selector updates.
- [x] Add portable Amanda service, manifest install entry, protected API and signed callback integration.
- [x] Add exact-source evidence descriptor and executable integration checks.
- [x] Run regression, build, lint and baseline type comparison.
- [x] Verify unchanged Amanda source and read-only production responses.
- [x] Save before/after proof in docs/CHASSIS_AUTOWIRE_FIX.md.

## Delivery boundary
Source artifact is published to fix/chassis-autowire after these checks. Production merge/deploy is not authorized; remote identity is verified separately in the delivery response.
