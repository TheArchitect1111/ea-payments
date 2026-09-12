# EA Modular Assembly — Run 1

Status: implementation complete pending CI/merge

## Objective

Classify the complete current EA module registry against the Run 0 capability standard, certify the universal core, and make the certified core executable in every portal.

## What changed

- Added `config/capability-inventory.json` as the machine-readable inventory for every module currently registered in `lib/modules/registry.ts`.
- Classified every module as `core`, `business`, or `specialized`.
- Certified Dashboard, Amplifi, and Update Hub as the universal EA core.
- Updated `CHASSIS_STANDARD_MODULE_IDS` so Amplifi is automatically included in every portal alongside Dashboard and Update Hub.
- Left every non-core module fail-closed at `inventoried` status until its dependencies, integrations, provisioning, tests, rollback, and cost/license boundary are specifically certified.
- Expanded `scripts/test-capability-standard.mjs` so CI rejects registry/inventory drift, missing contract fields, duplicate/unknown module ids, class mismatches, uncertified core targets, unapproved core cost/license boundaries, and certified core modules that are not enforced by the chassis.

## Universal core after Run 1

1. Dashboard
2. Amplifi
3. Update Hub

These three capabilities now have complete 16-field contracts, approved Run 1 cost/license boundaries, automatic tenant provisioning, health-check expectations, test expectations, and rollback behavior.

## Non-core policy

Business and specialized modules are inventoried but not silently promoted to Assembly-ready. Any unresolved dependency, integration, provisioning, test, or licensing question remains `review-required`.

This is deliberate. Run 1 establishes a trustworthy assembly boundary rather than treating the existence of code as proof that a module is safe to provision universally.

## Run 2 entry gate

Run 2 may begin when:

- the inventory contains every registered module exactly once;
- all 16 contract fields exist for every inventory entry;
- Dashboard, Amplifi, and Update Hub are certified core;
- the executable chassis enforces the same certified core set;
- non-certified modules remain fail-closed;
- CI passes on the Run 1 branch and the change is merged to authoritative `master`.
