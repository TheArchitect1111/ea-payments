# Calendar, People and Discovery certification proof

Delivery: `fix/blockers-certified`, based on master `3e7e1f85`. Branch-only implementation; no master merge or production promotion.

## Certification boundary

Version 2 certificates cover the EA-owned tenant installers, durable record contract, authenticated lifecycle, and rendered client components. Actual services execute against isolated database/provider ports in integration tests. Live provider readiness remains a mandatory install gate; isolated proof does not mean an external calendar is authorized, a deployed Postgres schema is ready, or a real email was delivered.

The requested `P/calendar` and `P/people` paths map to `app/portal/[slug]/calendar` and `app/portal/[slug]/people`.

| Brick | Storage/provider | Install entry | Preview provisioning route | Production test route | Payment | Lifecycle proof |
|---|---|---|---|---|---|---|
| Calendar v2 | Tenant Creative Studio event store; optional mapped Nylas grant/calendar | `installAdmittedModules` → `installCalendar` | `/api/calendar/tenant-provision-test` | GET/POST 404 before auth or writes | None | Create/update same event ID; install replay retains events; create/update tracking; provider mapping failure blocks install |
| People v2 | Existing dedicated Postgres `people` schema, `people_app` adapter; no Airtable/memory SoR | `installAdmittedModules` → Postgres readiness/read-back + durable receipt | `/api/people/tenant-provision-test` | GET/POST 404 before auth or writes | None | Identity upsert converges to one Person; stable active directory membership; append-only audit; flags/credentials/schema required |
| Discovery v2 | Tenant Creative Studio assessment, analysis, tracking and confirmation receipt | `installAdmittedModules` → `installDiscovery` | `/api/assessment/tenant-provision-test` | GET/POST 404 before auth or writes | None | Same request ID + actor + tenant retains same assessment; conflicting body rejected; saved confirmation retry; sequential replay sends once |

Calendar event creation and People contact creation do not require outbound confirmation letters; their saved state is shown in the portal. Discovery requires a confirmation and records its delivery receipt. People uses its existing append-only audit; Calendar and Discovery store tenant-scoped lifecycle tracking receipts.

No dollar charge is applicable. No Stripe/Square transaction is created by these modules.

## Actual autowire flow

1. `/api/admin/chassis/install` accepts requested modules, business options, industry packs and `moduleConfigs`.
2. Existing assembly preflight admits the exact certified IDs. The same list is passed to entitlements and the durable tenant installation journal.
3. `requireModuleProviders` validates configuration and probes People Postgres before any organization or entitlement writes. Explicit Nylas mappings are validated against the provider.
4. `installAdmittedModules` runs for every admitted Calendar/People/Discovery module and requires independent durable read-back. Default Calendar is immediately usable without external OAuth; existing mapped installations preserve their config on replay.
5. Only after installers and evidence succeed does the journal become `installed`.
6. The existing entitlement selector also prepares these module installers before granting newly enabled entitlements. Legacy tenants without an installation journal must use the manifest API first. Disabled entitlements deny reads/writes; stored data is retained.

Example manifest selection:

```json
{
  "portalSlug": "new-academy",
  "clientName": "New Academy",
  "packagePurchased": "Launch Verification",
  "requestedModuleIds": ["calendar", "people", "discovery"],
  "moduleConfigs": {
    "calendar": {"provider": "internal"},
    "people": {"provider": "postgres"},
    "discovery": {"brandName": "New Academy"}
  }
}
```

People install fails closed unless `UNIVERSAL_PEOPLE`, `UNIVERSAL_PEOPLE_PERSIST`, dedicated gateway/API credentials, People JWT credentials and the existing migrations/schema exposure are ready. Neither the route nor installer rewrites environment flags or silently substitutes memory.

## Provisioning tests

POST each test route with admin authorization and JSON `{"runId":"proof-1234"}`. Only a `cert-<module>-<runId>` fixture tenant can be created; arbitrary organization IDs and extra body fields are rejected. Test routes are allowed only in Vercel preview or an explicit local test process, never Vercel production, even if NODE_ENV is changed to test.

Calendar runs create → update → list and compares one same-ID event. People invokes the actual ensure/identity adapter twice and verifies one person. Discovery captures a test-only confirmation for a `.invalid` fixture email and verifies sequential replay. The response includes actual admitted IDs, persisted entitlement IDs, tenant ID and lifecycle result. Captured confirmation is explicitly identified as test delivery, not an external email.

## Evidence

- `tests/blockers-certified.test.mts`: real foundation/resolver/writer, install journal, Calendar and Discovery storage, Postgres People client/repository, API authorization and provisioning controller, with isolated ports.
- `scripts/test-blockers-ui.mjs`: actual client component bundles, desktop 1440 and mobile 390, input/submit interactions, browser errors and horizontal overflow. HTTP fixtures remain isolated.
- `scripts/certify-blockers.mjs`: exact source and test hashes, module version 2 and all ten evidence classes. Any source/test change fails verification until evidence is refreshed and checks rerun.
- `.github/workflows/blockers-certified.yml`: tests, exact hashes, Amanda regression evidence, assembly and certificate gates, rendered UI screenshots, build, and HTTP GET/POST 404 checks against the production-mode build artifact.

Local verification completed:

| Check | Result |
|---|---|
| `npm test` | 38 passed: Amanda 5, chassis 15, blockers 18 |
| People offline suite | 10 passed; 2 live Postgres cases explicitly skipped, not passes |
| People adversarial suite | 22 passed |
| Exact three-module and Amanda fingerprints | Passed |
| Module certificate contract/final acceptance | Passed for all 23 modules |
| Assembly Runs 4 and 6, tenant safety and release guardrails | Passed |
| Focused ESLint | Passed |
| Repository `tsc --noEmit` | Existing repository errors remain; normalized baseline comparison shows zero new diagnostics |

## Final executable verification record

- Source/test commit: `5256ab1e097041da94241886c46651f281eb64ac`.
- [CI run 38133373364](https://github.com/TheArchitect1111/ea-payments/actions/runs/38133373364): **SUCCESS** on 2026-10-11. All workflow gates completed.
- `npm test`: 38/38 pass in CI; People offline 10 pass / 2 explicit live skips; People adversarial 22/22 pass.
- Browser proof: all three actual client components submitted successfully at 1440px and 390px, no page errors or horizontal overflow. Six screenshots were independently inspected. This harness uses isolated HTTP fixtures, not a signed-in deployed tenant.
- [UI artifact 11699803655](https://github.com/TheArchitect1111/ea-payments/actions/runs/38133373364/artifacts/11699803655), SHA-256 `a325057460fceb5580024a22b1b5cf43421a91c5a2a2a94cfb88e08d249089a5`.
- `npm run build`: **PASS**. Production-mode built server: GET and POST for Calendar, People and assessment provisioning routes all **404**.
- [Source preview](https://ea-payments-k0v7kve1z-the-architects-projects-cc813778.vercel.app): Vercel **READY**, commit `5256ab1e`.
- Deployed route access checks on the prior source-identical route implementation (`67b4eb1` preview): all three GETs **405**, all three unauthenticated POSTs **401**. No admin session was invented; authenticated live provisioning was not executed.

The report completion commit changes only this document and the task checklist. It does not change certified source or tests. Certificates apply to the isolated executable boundary above; live external provider readiness and delivery are **not certified by this run**.

## Existing production protection and limits

Existing Amanda client files and TB3 flows are unchanged. The public `/assessment` redirect to the existing CTP entry remains; an optional `portal` query links to authenticated tenant discovery. New chassis Discovery links to `/portal/[slug]/discovery`. The original public CTP/assessment submit pipeline is a separate legacy flow and is not newly certified by this change.

Calendar event writes and Discovery email delivery have sequential replay proof. Cross-instance Airtable updates are not transactional; distributed locking/outbox semantics and exactly-once external email are not claimed. Tenant installs with missing providers cannot be marked installed. These are explicit limits, not silent success paths.

Live Nylas OAuth, live Postgres writes, real confirmation email delivery and authenticated preview provisioning are distinct runtime checks and will be reported separately from fixture certification. No production tenant or payment is modified to obtain branch proof.
