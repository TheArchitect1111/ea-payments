# NOW

Last updated: 2026-07-12

## Objective

Stabilize the existing EA Ecosystem foundation before any rename, restructuring, or production change.

## Verified baseline

- Canonical working repository: `TheArchitect1111/ea-payments`.
- Branch: `master`; baseline commit: `d48f439`.
- Vercel linkage observed locally: project `ea-payments` (`prj_u7zAr2vz8bLLC4s77xlU5FnB8VTM`).
- Package name: `simplifi`.
- Safety checkpoint: local branch `checkpoint/ea-ecosystem-preflight-2026-07-12`, commit `2fd6465`.
- Preserved pre-existing change: `lib/capture-records.ts`.

## In progress

- Fail-closed tenant roles and membership fallback.
- Tenant-namespaced AI conversation history.
- Exact, delimiter-safe portal capture scoping.
- Registry-driven repository inventory and focused tests.

## Review gate

Stop after documentation, focused tenant-safety changes, and checks. Do not rename repositories/projects, move major folders, change production configuration, delete data, or deploy until a reviewer approves a new checkpoint.

## Tenant data audit

- Read-only audit tooling is available through `npm run audit:tenant-data`.
- Live execution is blocked because no Airtable read credential is present locally.
- `AIRTABLE_PLATFORM_BASE_ID` versus `AIRTABLE_PAYMENTS_BASE_ID` must be resolved before migration work.
- See `docs/TENANT-DATA-READINESS.md`.
