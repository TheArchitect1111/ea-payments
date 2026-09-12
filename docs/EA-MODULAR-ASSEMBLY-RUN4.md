# EA Modular Assembly — Run 4

Date: 2026-09-12

## Objective

Make the first complete commercial EA package, `Website + Portal Starter`, provisionable through certified mode while preserving the Run 0 cost/license guardrails and keeping optional provider extensions isolated.

## Canonical Starter entitlement discovery

Run 4 verified the package against the authoritative `@ea/payments-contract` instead of relying on the legacy `PACKAGE_MODULE_GRANTS` fallback. The canonical contract grants a larger Starter surface than the fallback map. Run 4 does not silently remove purchased capabilities to make certification easier.

The canonical `Website + Portal Starter` assembly contains 19 modules:

1. `dashboard`
2. `amplifi`
3. `update-hub`
4. `landing`
5. `pulse`
6. `ctp`
7. `member`
8. `messaging`
9. `documents`
10. `events`
11. `training`
12. `resources`
13. `ask`
14. `connect`
15. `billing`
16. `settings`
17. `intake`
18. `applications`
19. `reports`

The universal chassis already certified Dashboard, Amplifi, and Update Hub. Run 3 certified Intake, Applications, and Reports. Run 4 certifies the remaining 13 canonical Starter capabilities:

- `landing`
- `pulse`
- `ctp`
- `member`
- `messaging`
- `documents`
- `events`
- `training`
- `resources`
- `ask`
- `connect`
- `billing`
- `settings`

## Provider boundaries

### Events

The EA Calendar & Event Hub can provision and operate without a Pretix account. Its calendar/default route, shared scheduling surface, EA registration ledger, and empty-state behavior are part of the certified boundary. Pretix remains an optional provider extension and is not promoted to a universal dependency by this run.

### Documents

The certified Document Hub uses EA tenant uploads, CTP deliverables, and Update Hub files. Documenso is not required for assembly. It remains isolated as an optional signing provider rather than becoming a mandatory Starter dependency.

### Messaging

The certified Messaging surface uses EA portal communication and Update Hub services. Novu is not required for assembly and remains an optional future provider extension.

### Billing

The EA billing workspace and authorization boundary are certified with the existing platform-managed Stripe adapter. Run 4 does not require a separate Stripe account for each client and introduces no new per-client software license. If the platform Stripe adapter is unavailable, the billing endpoint fails safely instead of pretending billing is configured. Normal payment-processing charges, when commerce is actually used, are outside the assembly-license decision.

### EA-native capabilities

Landing, Pulse, CTP, Member, Training, Resources, Guide, Connect, and Settings are certified across their existing EA-owned portal and data-service boundaries. Run 4 introduces no new paid vendor account or per-client software license for these capabilities.

## Forward-compatible certification contracts

Run 2 established fail-closed admission. Run 3 established the first reusable business wave. Their tests originally used specific modules as examples of an uncertified state. Run 4 replaces those frozen-state assumptions with forward-compatible invariants so later explicit certifications do not invalidate earlier architecture tests.

The Assembly Engine remains fail-closed for unknown modules and for known modules that have not received explicit certification and cost/license approval.

## Client Factory result

`requireClientFactoryAssembly({ packagePurchased: 'Website + Portal Starter' })` now succeeds for the full canonical 19-module entitlement set. A new Client Factory path may use `assemblyMode: 'certified'` for this package and receive a fully admitted package before any tenant-foundation write.

Existing client provisioning behavior remains unchanged unless certified mode is explicitly selected.

## Capabilities intentionally not admitted by Run 4

Non-Starter unresolved capabilities remain fail-closed. Run 4 explicitly verifies that `calendar`, `people`, and `simplifi` are not admitted without a later certification decision.

## Acceptance

Run 4 is complete only when:

1. Run 2 and Run 3 certification remain green.
2. Website + Portal Starter resolves to the canonical 19-module entitlement set.
3. The complete package has zero assembly rejections.
4. Pretix, Documenso, and Novu are proven optional rather than required assembly dependencies.
5. Billing is proven to fail safely when the platform Stripe adapter is unavailable.
6. Non-Starter unresolved capabilities remain fail-closed.
7. Run 3 and Run 4 certification are permanent main-CI checks.
8. Repository CI, protection gates, and dedicated Run 4 certification pass.
9. The PR is merged to authoritative `master` and master acceptance is green.

## Run 5 entry gate

Run 5 may begin after master acceptance. Its target is to connect certified mode to the new-client commercial provisioning path for `Website + Portal Starter`, persist durable per-tenant assembly evidence, and then certify the next package wave without automatically admitting capabilities whose licensing or operational boundaries remain unresolved.
