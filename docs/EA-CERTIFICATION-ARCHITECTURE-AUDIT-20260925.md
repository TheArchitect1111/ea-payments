# EA Certification Architecture Audit — 2026-09-25

## Executive finding

EA has substantial protection and modular-assembly machinery, but release boundaries are too broad and sources of truth are duplicated. Client delivery is therefore blocked by unrelated repository debt and a passing module certificate does not always mean the client-specific business lifecycle has been proven end to end.

## Evidence

1. `.github/workflows/ci.yml` runs one repository-wide lint plus dozens of unrelated product, factory, recovery, athlete, Amplifi, Amanda and Playwright suites for every pull request to master.
2. The dedicated Modular Assembly Run 6, Client Protection Gate and structural verification can pass while global CI fails on unrelated legacy code.
3. `config/capability-inventory.json` and `config/capability-certifications.json` are separate status authorities. Assembly overlays certifications on inventory at runtime, so the inventory can still say `inventoried` while the effective assembly state is `certified`.
4. `TENANT_MODULE_PRESETS['ea-client']` includes modules that the Run 6 contract explicitly keeps fail-closed, including `people`. Default package resolution can therefore describe a module set that is not identical to the certified assembly admission decision.
5. Amanda has multiple historical recovery/preflight workflows still present beside the canonical client protection system. Recovery workflows are useful during incidents, but permanent coexistence increases operational ambiguity.
6. Amanda's canonical registry is materially improved: `clients/amanda-catherine/client.json` and `lib/canonical-project-registry.ts` identify ea-payments as canonical application source and retired projects as non-canonical. This protection should be the pattern for all clients.
7. Current capability evidence is mostly contract/route/build evidence. A reusable Lego piece needs stronger certification: persistence, permissions, failure states, integration dependencies, responsive behavior, observability, rollback and a real lifecycle test.

## Root causes

- Monolithic release gate: unrelated products share one pass/fail decision.
- Duplicate certification truth: inventory and certification overlay can drift.
- Entitlement/assembly mismatch: presets can name capabilities that assembly certification rejects.
- Historical automation accumulation: incident/recovery workflows remain beside current production workflows.
- Certification depth gap: route/build success is not equivalent to business-function success.
- Client acceptance gap: client-specific CTA-to-record-to-owner lifecycle proof is not universally required before launch.

## Target architecture

Four release scopes:
1. Platform Core — auth, tenant isolation, shared data contracts, deployment protection.
2. Certified Lego Modules — independently versioned capabilities with immutable certification evidence.
3. Client Assembly — only the modules selected by the client manifest, plus connection tests.
4. Legacy/Experimental — isolated from client promotion unless explicitly depended upon.

A module may be marked CERTIFIED only when machine evidence proves:
- route/render and responsive UI
- authorization and tenant isolation
- durable persistence
- dependency and integration readiness
- success, empty and failure states
- activity/observability events
- rollback/disable path
- end-to-end business lifecycle where applicable
- version/hash of the tested implementation

## Repair plan: 4 runs

### Run A — Release Boundary
Split global CI into platform-core, module-scoped, client-scoped and legacy/experimental checks. Keep security and tenant-safety universal. Client promotion must not fail because of unrelated standalone tooling.

### Run B — Single Certification Truth
Generate effective module state from one canonical certification manifest. Remove inventory/certification ambiguity and enforce that tenant presets/package grants can only resolve to certified modules.

### Run C — Lego 100% Contract
Upgrade module certificates to require executable functional evidence, dependency checks, persistence, permissions, observability, responsive checks and rollback. Add immutable certificate version/hash.

### Run D — Client Assembly Acceptance
Create a manifest-driven client gate that tests only the client's selected certified modules plus their connections and client-specific lifecycle. For Amanda, require public CTA → application/enrollment → payment/webhook when applicable → entitlement → learning/access → owner visibility → activity evidence.

## Exit criteria

No client can be called launch-ready unless:
- every selected module has a current immutable certificate;
- the client manifest references only certified versions;
- platform security gates pass;
- client connection/lifecycle tests pass;
- desktop/mobile visual/product QA passes;
- production deployment SHA matches the certified source;
- rollback and monitoring are verified.

This audit is the governing plan for the next repair sequence. Do not weaken security, tenant isolation, payment correctness or production protection to obtain a green build.
