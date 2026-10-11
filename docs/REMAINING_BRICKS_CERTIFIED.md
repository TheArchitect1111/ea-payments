# Remaining chassis bricks: audit and certification status

**Branch:** `fix/remaining-bricks-certified` (not merged into master). **Production baseline:** `0b91edac` (certified source `bf5f5987`).

## Inventory discrepancy

Requested `docs/BRICKS_AUDIT.md` does not exist on the inspected production ref. The canonical `lib/modules/registry.ts` contains **23 module IDs**. The dedicated certified module installers are `calendar`, `people`, `discovery`. This leaves **20**, not 19, registry modules needing separate lifecycle certification. Amanda is a portable **client adapter**, not one of those 23 registry module IDs. We cannot subtract Amanda from the 20 and silently omit a real module.

## What this branch implements

`lib/bricks/module-install.ts` now persists durable tenant-scoped module-selection installation receipts for all non-dedicated selected modules. Existing records are replayed without rewriting, and a module/version mismatch fails closed. It uses the existing tenant validation and Airtable read-back persistence. The dedicated Calendar, People and Discovery installers remain unchanged. **This is shared receipt-level wiring, not proof of 100% functional autowire.** The receipt must not be interpreted as evidence of payment, signup, notifications, or other functional lifecycle readiness.

| Brick | Certified YES/NO | Test | Autowires | Missing |
|---|---|---|---|---|
| dashboard | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| pulse | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| simplifi | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| amplifi | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| connect | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| update-hub | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| training | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| landing | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| documents | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| messaging | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| events | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| resources | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| ask | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| billing | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| settings | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| ctp | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| member | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| intake | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| applications | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |
| reports | NO | Durable selection receipt (not executed in CI) | Receipt-level only | Dedicated lifecycle adapter, idempotency/provider integration tests; production 404 test-route proof |

## Required acceptance before YES

Each module needs a tenant-portable adapter or a clearly verified existing equivalent, durable business-record persistence, consistent-tenant readback, replay idempotency, functional write/list/update proof, tracking when applicable, and a Vercel-preview-only provisioning fixture returning GET/POST 404 in actual production. Payment modules require Stripe test-key isolation and same-row verified payment replay. Every new test must be executed; `npm test`, `npm run build`, and production-mode route probes must pass.

**Verification status:** New receipt logic has been pushed to a feature branch. No local npm install, test, build, or production-mode HTTP test has been executed in this environment. Do not claim certification or merge this branch until these checks and module-specific provider flows pass. Existing production remains unchanged.
