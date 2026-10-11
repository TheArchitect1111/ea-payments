# Remaining chassis bricks: audit and certification status

**Branch:** `fix/remaining-bricks-certified` (not merged into master). **Production baseline:** `0b91edac` (certified source `bf5f5987`).

## Inventory discrepancy

Requested `docs/BRICKS_AUDIT.md` does not exist on the inspected production ref. The canonical `lib/modules/registry.ts` contains **23 module IDs**. The dedicated certified module installers are `calendar`, `people`, `discovery`. This leaves **20**, not 19, registry modules needing separate lifecycle certification. Amanda is a portable **client adapter**, not one of those 23 registry module IDs. We cannot subtract Amanda from the 20 and silently omit a real module.

## What this branch implements

`lib/bricks/module-install.ts` now persists durable tenant-scoped module-selection installation receipts for all non-dedicated selected modules. Existing records are replayed without rewriting, and a module/version mismatch fails closed. It uses the existing tenant validation and Airtable read-back persistence. The dedicated Calendar, People and Discovery installers remain unchanged. **This is shared receipt-level wiring, not proof of 100% functional autowire.** The receipt must not be interpreted as evidence of payment, signup, notifications, or other functional lifecycle readiness.

| Brick | Certified YES/NO | Has Installer | Has Replay Protection | Has Provisioning Test | 404 in Prod | Autowires |
|---|---|---|---|---|---|---|
| dashboard | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| pulse | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| simplifi | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| amplifi | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| connect | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| update-hub | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| training | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| landing | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| documents | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| messaging | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| events | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| resources | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| ask | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| billing | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| settings | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| ctp | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| member | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| intake | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| applications | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |
| reports | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | CI pending | Selection receipt only |

## Required acceptance before YES

Each module needs a tenant-portable adapter or a clearly verified existing equivalent, durable business-record persistence, consistent-tenant readback, replay idempotency, functional write/list/update proof, tracking when applicable, and a Vercel-preview-only provisioning fixture returning GET/POST 404 in actual production. Payment modules require Stripe test-key isolation and same-row verified payment replay. Every new test must be executed; `npm test`, `npm run build`, and production-mode route probes must pass.

**Verification status:** New receipt logic has been pushed to a feature branch. A branch-only GitHub CI workflow now runs npm test (including 20 structural contract checks), npm run build, and GET/POST production-mode 404 probes; its outcome must be inspected before claiming passes. No real end-to-end provider, payment, capture, notification, ACL, or job-generation proof has been executed. Do not claim certification or merge this branch until these checks and module-specific provider flows pass. Existing production remains unchanged.
