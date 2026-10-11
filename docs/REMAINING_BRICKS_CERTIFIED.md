# Remaining chassis bricks: audit and certification status

**Branch:** `fix/remaining-bricks-certified` (not merged into master). **Production baseline:** `0b91edac` (certified source `bf5f5987`).

## Inventory discrepancy

Requested `docs/BRICKS_AUDIT.md` does not exist on the inspected production ref. The canonical `lib/modules/registry.ts` contains **23 module IDs**. The dedicated certified module installers are `calendar`, `people`, `discovery`. This leaves **20**, not 19, registry modules needing separate lifecycle certification. Amanda is a portable **client adapter**, not one of those 23 registry module IDs. We cannot subtract Amanda from the 20 and silently omit a real module.

## What this branch implements

`lib/bricks/module-install.ts` now persists durable tenant-scoped module-selection installation receipts for all non-dedicated selected modules. Existing records are replayed without rewriting, and a module/version mismatch fails closed. It uses the existing tenant validation and Airtable read-back persistence. The dedicated Calendar, People and Discovery installers remain unchanged. **This is shared receipt-level wiring, not proof of 100% functional autowire.** The receipt must not be interpreted as evidence of payment, signup, notifications, or other functional lifecycle readiness.

| Brick | Certified YES/NO | Has Installer | Has Replay Protection | Has Provisioning Test | 404 in Prod | Autowires |
|---|---|---|---|---|---|---|
| dashboard | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| pulse | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| simplifi | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| amplifi | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| connect | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| update-hub | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| training | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| landing | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| documents | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| messaging | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| events | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| resources | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| ask | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| billing | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| settings | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| ctp | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| member | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| intake | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| applications | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |
| reports | NO | Receipt installer | Yes, receipt only | Yes, receipt probe, lifecycle not proved | YES (CI) | Selection receipt only |

## Executed branch acceptance proof

- [GitHub Actions run 38136272668](https://github.com/TheArchitect1111/ea-payments/actions/runs/38136272668) finished **SUCCESS** on the branch after adding executable receipt replay tests.
- `npm test` **PASS**: existing Amanda, chassis and Calendar/People/Discovery tests plus 22 inventory/wiring assertions and 20 executable per-module tenant-partition/replay/durable-write-failure tests.
- `npm run build` **PASS**.
- Production-mode built-server checks **PASS**: both GET and POST return **404** for `/api/bricks/tenant-provision-test`, `/api/calendar/tenant-provision-test`, `/api/people/tenant-provision-test`, `/api/assessment/tenant-provision-test`.
- New shared test route supports all 20 module IDs on preview, checks admission and saved install receipts, and explicitly declares `lifecycleCertified:false`. The integration suite does **not** use authenticated remote Airtable or Stripe sessions.

## Individual functional acceptance gaps

- **Capture (simplifi, connect, intake, applications):** domain-specific capture records, stable business identity, same-row update and tracking with replay tests still need actual writes/read-back against the intended provider.
- **Requests (ask/Guide, messaging, update-hub):** request submission, delivery, conversation response and feed freshness/authorization must be wired and executed, not just installed.
- **Content (dashboard, pulse, documents, resources, reports):** persisted tenant defaults, storage ACL, generated artifact/job state, and authorized read-back require domain integration tests.
- **Commerce/journey (billing, events, member, ctp, training, landing):** registration/enrollment, Stripe test-credential isolation, webhook and payment replay, confirmation, publish/forms and provider readiness still require dedicated implementation and test proof. Payment test routes must be preview-only.
- **Other (amplifi, settings):** content/publish workflow with authorization and tenant settings read-write/read-back must be verified separately.

**Certification decision:** 0 of the remaining 20 bricks meet the user's required full business-lifecycle standard yet. Twenty have a shared durable selection receipt and executable isolated replay tests. No branch changes have been merged into production master.

## Required acceptance before YES

Each module needs a tenant-portable adapter or a clearly verified existing equivalent, durable business-record persistence, consistent-tenant readback, replay idempotency, functional write/list/update proof, tracking when applicable, and a Vercel-preview-only provisioning fixture returning GET/POST 404 in actual production. Payment modules require Stripe test-key isolation and same-row verified payment replay. Every new test must be executed; `npm test`, `npm run build`, and production-mode route probes must pass.

**Verification status:** New receipt logic has been pushed to a feature branch. The branch-only GitHub CI proof above passed; isolated receipts remain insufficient for full per-brick lifecycle certification. No real end-to-end provider, payment, capture, notification, ACL, or job-generation proof has been executed. Do not claim certification or merge this branch until these checks and module-specific provider flows pass. Existing production remains unchanged.
