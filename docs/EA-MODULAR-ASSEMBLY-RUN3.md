# EA Modular Assembly — Run 3

Date: 2026-09-12

## Objective

Certify the first reusable business-capability wave and connect new Client Factory provisioning to the fail-closed Assembly Engine without changing established-client entitlements.

## Certified business wave

Run 3 certifies these existing EA-owned portal capabilities:

- `intake`
- `applications`
- `reports`

Each capability already exists in the canonical module registry, has a deterministic portal route, requires no new paid vendor account for this certification boundary, and remains removable through the existing module/release rollback model.

Capabilities with unresolved vendor, licensing, data, or provisioning questions remain inventoried/review-required. In particular, Run 3 does not certify events, calendar, billing, documents, training, messaging, or people.

## Certification ledger

`config/capability-certifications.json` is an additive evidence ledger. The Run 1 inventory remains the discovery record; the ledger records later explicit certification decisions. The Assembly Engine checks the ledger first and otherwise falls back to inventory state.

## Client Factory connection

`lib/modules/client-factory-assembly.ts` resolves package entitlements and routes the resulting module set through the Run 2 Assembly Engine.

`ensureTenantFoundation()` now supports `assemblyMode: 'certified'`. In that mode, the Client Factory assembly requirement runs before any organization or entitlement write. If even one requested package capability is not certified, provisioning throws and no foundation write begins.

Legacy callers remain unchanged by default. This prevents Run 3 from stripping or altering established client entitlements while providing the safe boundary required for new automated provisioning.

## Acceptance

Run 3 is complete only when:

1. Run 2 certification still passes.
2. Intake, Applications, and Reports are admitted with the universal chassis.
3. An uncertified module remains rejected.
4. Client Factory package planning uses the Assembly Engine.
5. A partially certified package fails closed before provisioning writes.
6. Full repository CI and protection gates pass.
7. The PR is merged to authoritative `master` and master acceptance is green.

## Run 4 entry gate

Run 4 may begin after master acceptance. Its target is to certify the next business wave needed to make a complete commercial package provisionable in certified mode, starting with the unresolved capabilities in `Website + Portal Starter`, while keeping vendor-dependent modules isolated until their licensing and operational boundaries are explicit.
