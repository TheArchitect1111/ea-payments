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

Validation status and exact branch/preview identifiers are appended after checks finish.

## Existing production protection and limits

Existing Amanda client files and TB3 flows are unchanged. The public `/assessment` redirect to the existing CTP entry remains; an optional `portal` query links to authenticated tenant discovery. New chassis Discovery links to `/portal/[slug]/discovery`. The original public CTP/assessment submit pipeline is a separate legacy flow and is not newly certified by this change.

Calendar event writes and Discovery email delivery have sequential replay proof. Cross-instance Airtable updates are not transactional; distributed locking/outbox semantics and exactly-once external email are not claimed. Tenant installs with missing providers cannot be marked installed. These are explicit limits, not silent success paths.

Live Nylas OAuth, live Postgres writes, real confirmation email delivery and authenticated preview provisioning are distinct runtime checks and will be reported separately from fixture certification. No production tenant or payment is modified to obtain branch proof.
