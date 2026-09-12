# EA Modular Assembly — Run 2

Status: implementation complete pending CI/merge

## Objective

Close the gap between commercial/package entitlements and safe module assembly by introducing a deterministic, fail-closed Assembly Engine.

Run 1 established which capabilities are certified. Run 2 makes that certification executable.

## What changed

- Added `lib/modules/assembly.ts` as the canonical assembly planner.
- The planner always includes the certified universal core: Dashboard, Amplifi, and Update Hub.
- Requested modules are admitted only when the capability inventory explicitly marks them `certified` and their cost/license decision is `approved`.
- Unknown modules are rejected.
- Inventoried or review-required modules are rejected rather than silently provisioned.
- Duplicate requests are normalized.
- `requireAssemblyPlan()` provides a strict provisioning boundary that throws whenever any requested capability is rejected.
- Added `scripts/test-modular-assembly-run2.ts` to certify these guarantees in CI.

## Why this matters

Before Run 2, package and tenant presets could name capabilities that existed in the codebase even though the new capability standard had not certified them for reusable assembly. That is useful for legacy runtime behavior but unsafe as the foundation for an automated client factory.

Run 2 creates a clean separation:

1. Entitlement answers what a client may receive.
2. Certification answers what EA knows how to assemble safely.
3. The Assembly Engine admits only capabilities that satisfy both the certification state and the cost/license boundary.

No existing tenant/package resolver is replaced in Run 2. This prevents a safety improvement from unexpectedly removing modules from established clients. The new Assembly Engine is the guarded path for future automated provisioning.

## Safety properties

- fail closed on unknown module ids;
- fail closed on uncertified capability state;
- fail closed when cost/license approval is missing;
- universal core cannot be omitted;
- deterministic output for identical requests;
- no new paid vendor account or dependency introduced.

## Run 3 entry gate

Run 3 may begin when:

- Run 2 certification passes in CI;
- the Assembly Engine is merged to authoritative `master`;
- master acceptance checks pass;
- business modules remain unavailable to automated provisioning until individually certified.

Run 3 should certify the first reusable business capability wave and connect the Client Factory/provisioning path to the Assembly Engine without altering established-client entitlements unexpectedly.
