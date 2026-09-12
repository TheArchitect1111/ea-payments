# EA Modular Assembly — Run 4

Date: 2026-09-12

## Objective

Make the first complete commercial EA package, `Website + Portal Starter`, provisionable through certified mode while preserving the Run 0 cost/license guardrails and keeping optional provider extensions isolated.

## Starter package certification

The package already included the universal chassis plus seven package modules. Run 3 certified Intake, Applications, and Reports. Run 4 certifies the remaining four:

- `member`
- `events`
- `billing`
- `settings`

The complete certified assembly is therefore:

1. Dashboard
2. Amplifi
3. Update Hub
4. Member Experience
5. Calendar & Event Hub
6. Billing
7. Settings
8. Intake
9. Applications
10. Reports

## Provider boundaries

### Events

The EA Calendar & Event Hub can provision and operate without a Pretix account. Its calendar/default route, shared scheduling surface, EA registration ledger, and empty-state behavior are part of the certified boundary. Pretix remains an optional provider extension and is not promoted to a universal dependency by this run.

### Billing

The EA billing workspace and authorization boundary are certified with the existing platform-managed Stripe adapter. Run 4 does not require a separate Stripe account for each client and introduces no new per-client software license. If the platform Stripe adapter is unavailable, the billing endpoint fails safely instead of pretending billing is configured. Normal payment-processing charges, when commerce is actually used, are outside the assembly-license decision.

### Member and Settings

These are EA-owned portal surfaces backed by existing tenant/member/configuration services. No new vendor account or license is introduced.

## Client Factory result

`requireClientFactoryAssembly({ packagePurchased: 'Website + Portal Starter' })` now succeeds. This means a new Client Factory path may use `assemblyMode: 'certified'` for this package and receive a fully admitted package before any tenant-foundation write.

Existing client provisioning behavior remains unchanged unless certified mode is explicitly selected.

## Acceptance

Run 4 is complete only when:

1. Run 2 and Run 3 certification remain green.
2. Website + Portal Starter resolves to the expected ten-module assembly.
3. The package has zero assembly rejections.
4. Pretix is proven optional for the Events admission boundary.
5. Billing is proven to fail safely when the platform Stripe adapter is unavailable.
6. Unresolved capabilities remain fail-closed.
7. Repository CI, protection gates, and dedicated Run 4 certification pass.
8. The PR is merged to authoritative `master` and master acceptance is green.

## Run 5 entry gate

Run 5 may begin after master acceptance. Its target is to connect certified mode to the new-client commercial provisioning path for `Website + Portal Starter`, produce durable assembly evidence per provisioned tenant, and then certify the next package wave without automatically admitting vendor-dependent capabilities whose licensing or operational boundaries remain unresolved.
