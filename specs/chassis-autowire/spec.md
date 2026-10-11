# Feature Specification: Certified chassis selection and portable enrollment

Request: Persist the actual admitted module selection; add a portable Amanda install adapter. Branch only; do not merge.
Project: ea-payments, baseline master 7a8c4f0.
Status: Implementation authorized.

## Intent and scope
One certified selection drives entitlement persistence and durable tenant installation. Business options and industry packs expand into the same plan. Amanda is a composite reusable enrollment service over existing certified modules, not a replacement for its existing client routes.

## Source of truth
lib/modules/registry.ts, config/capability-inventory.json, config/module-certification-evidence.json, SECURITY-MODEL.md.

## Protected invariants
Existing Amanda source/routes/configuration remain unchanged. No production writes or payment execution. Tenant identity comes from authenticated persisted organization/membership. No uncertified module becomes selectable by bypass. Legacy callers remain compatible unless they explicitly select a new manifest.

## Acceptance criteria
1. Explicit modules, business options, industry packs and brick dependencies are certified before writes.
2. The exact admitted IDs are persisted and independently read back; later package backfill preserves them.
3. Missing persistence, rejected modules and install failure cannot report success.
4. Portable Amanda signup/payment use tenant-scoped deterministic registration identity, verified Stripe correlation, durable tracking events and configurable confirmation.
5. New project manifest selects the adapter and installs its configuration; existing Amanda files are unchanged.
6. Focused integration tests and npm test pass; type/build checks assessed; branch pushed without merging.

## Rollback and verification
Discard/revert branch changes. Production deployment is out of scope explicitly. Verify local integration harness and existing production read-only route, then remote branch identity.
