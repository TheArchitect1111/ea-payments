# EA Lego Certification Evidence Audit — Run 1

Date: 2026-09-25
Scope: canonical `config/capability-inventory.json` on master.
Rule: evidence is credited only when an existing executable contract materially addresses the evidence class. Shared platform tests are not treated as proof of module-specific behavior unless the test names or inspects the module boundary.

## Executive result

- 23 inventory modules total.
- 20 currently carry `assemblyStatus: certified`.
- 3 are correctly fail-closed as inventoried: `calendar`, `people`, `discovery`.
- The current Lego gate is structural, not 10-class functional certification.
- No current certified module has an explicit 10/10, exact-version evidence certificate in the canonical inventory.
- Seventeen certified business/specialized modules still contain one or more `review-required` dependency, integration, or provisioning fields. That is incompatible with the new 10/10 definition until resolved or explicitly bounded by executable evidence.
- Existing tests are substantial and reusable. The gap is evidence attribution, missing class coverage, exact-version fingerprinting, and fail-closed enforcement.

## Evidence legend

P = existing evidence found that materially supports this class.
S = shared/structural evidence only; not enough for a module-specific 10/10 certificate.
M = no adequate evidence identified in Run 1.

Classes:
R route/render; UI responsive UI; A authorization/tenant isolation; D durable persistence; I dependency/integration readiness; F success/empty/failure states; O observability; X rollback/disable; B business lifecycle; H immutable version fingerprint.

| Module | R | UI | A | D | I | F | O | X | B | H | Run 1 finding |
|---|---|---|---|---|---|---|---|---|---|---|---|
| dashboard | P | S | S | S | S | S | S | S | S | M | core route exists; no exact module certificate |
| amplifi | P | S | S | P | P | P | P | S | P | M | deep product tests exist; fingerprint/rollback proof absent |
| update-hub | P | S | S | P | S | S | P | S | S | M | activity surface exists; module-specific lifecycle/error proof incomplete |
| events | P | S | S | P | P | S | P | S | P | M | strong Event Hub persistence/provider/reminder evidence; UI/error/fingerprint gaps |
| billing | P | S | P | P | P | P | S | S | P | M | strongest authorization/fail-safe evidence; fingerprint/observability/rollback gaps |
| documents | P | S | S | P | P | S | S | S | S | M | native boundary proven; full lifecycle/error/fingerprint gaps |
| training | P | S | S | P | S | S | S | S | P | M | entitlement/learning paths exist; incomplete module certificate |
| messaging | P | S | S | P | P | S | P | S | S | M | native boundary exists; lifecycle/error/fingerprint gaps |
| intake | P | S | S | P | S | P | P | S | P | M | portal form ledger/notification contract is strong; exact auth/UI/fingerprint gaps |
| applications | P | S | S | P | S | P | P | S | P | M | submit/queue/shared-ledger contract is strong; exact auth/UI/fingerprint gaps |
| reports | P | S | S | P | S | S | S | S | P | M | curated report contract exists; state/observability/fingerprint gaps |
| pulse | P | S | P | P | S | S | P | S | S | M | tenant-safety and event infrastructure exist; full lifecycle/fingerprint gaps |
| simplifi | P | P | P | P | P | P | P | S | P | M | extensive hardening suite; exact fingerprint/rollback certificate absent |
| connect | P | S | P | P | S | S | S | S | P | M | capture E2E/tenant controls exist; incomplete states/observability/fingerprint proof |
| landing | P | P | P | P | P | P | P | S | P | M | Experience Builder/publish tests are substantial; fingerprint/rollback certificate absent |
| resources | P | S | S | P | S | S | S | S | S | M | route/native resource surface exists; several functional classes unproven |
| ask | P | S | P | P | S | P | P | S | P | M | Guide auth/progress/orchestration tests exist; fingerprint/rollback gaps |
| ctp | P | P | P | P | P | P | P | S | P | M | broad CTP suite exists; exact fingerprint/rollback certificate absent |
| member | P | S | S | P | S | S | S | S | S | M | starter/entitlement evidence exists; several module-specific classes unproven |
| settings | P | S | P | P | S | P | S | S | P | M | scheduling/booking persistence and staff boundary exist; fingerprint/observability gaps |

## Evidence already worth preserving

1. `scripts/test-tenant-safety.mjs` contains concrete tenant and RBAC assertions for billing, Pulse, Guide, Capture/Connect, Experience Builder/Landing, CTP and platform session boundaries.
2. `scripts/test-event-hub-mandatory-cert.mjs` verifies Event Hub tabs, durable Airtable ledger, Pretix ingestion, reminders, authorization of cron execution and scheduled monitoring.
3. `scripts/test-portal-scheduling-cert.mjs` verifies persisted booking configuration and staff-only mutation.
4. `scripts/test-portal-intake-cert.mjs` verifies the durable form ledger, submit/status APIs and notification event.
5. `scripts/test-portal-applications-cert.mjs` verifies application submission and owner-facing queue consumption of the shared ledger.
6. `scripts/test-portal-reports-cert.mjs` verifies report aggregation and module gating.
7. Simplifi, Amplifi, CTP and Experience Builder/Landing already have deeper dedicated suites that can populate much of the 10-class matrix rather than being rewritten.
8. The production/recovery suites provide useful shared evidence, but shared evidence alone must not award a module-specific class.

## Structural contradictions to resolve in Run 2/3

The canonical inventory marks modules certified while many still declare `review-required` for dependencies, integrations, or provisioning. A strict certificate must either:
- replace that status with an explicitly certified native boundary backed by executable evidence, or
- keep the unresolved dependency outside the certified boundary, or
- remove the module from the certified bin.

The current `test-lego-certification-contract.mjs` only checks version, approved cost/license, route, health check, rollback metadata and presence of some tests. It never reads or enforces the ten evidence classes in `module-certification-contract.json`.

The current `version: 1` values are labels, not immutable fingerprints. There is no module source hash/evidence hash binding the certificate to the exact implementation.

## Run 1 conclusion

Run 1 does **not** downgrade modules. It establishes the evidence debt without destabilizing existing client assemblies.

The evidence audit confirms that Run 2 must introduce a machine-readable per-module certificate schema and a fail-closed validator. Run 3 then fills genuine evidence gaps or quarantines modules. Run 4 locks exact certificates into assembly/CI.

**Run 1 status: COMPLETE.**
