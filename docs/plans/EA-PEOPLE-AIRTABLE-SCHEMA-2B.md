# EA People — Airtable Schema (Phase 2B)

**Status:** Operator contract — create in Payments base (or dedicated cert base) before enablement  
**Code source of truth:** `lib/people/airtable-tables.ts`  
**Verify:** `npx tsx scripts/verify-people-airtable-schema.mts`

## Tables (exact default names)

| Table | Purpose |
|---|---|
| People | Directory root (`Person Key`) |
| People Org Memberships | Directory roles (not PlatformRole) |
| People Households | Household containers |
| People Household Members | Household membership |
| People Relationships | Graph edges |
| People Program Links | Program / Client Record links |
| People Consents | Consent records |
| People ACL Grants | Resource ACL |
| People Audit | Append-only audit |
| People Merge Jobs | Merge state machine |
| People Import Jobs | Import job state |
| People Import Row Results | Per-row import outcomes |
| People Migration Checkpoints | Client Record backfill checkpoints |

Table names are overridable via `AIRTABLE_PEOPLE_*_TABLE` env vars (see `.env.example`).

## Critical identity / idempotency key fields (application-enforced)

**Correction:** Airtable does **not** provide native enforceable UNIQUE constraints for ordinary text fields. Do **not** claim `Person Key`, `OrgEmailKey`, `OrgExternalKey`, `Membership Key`, `Edge Key`, `Job Key`, or `Idempotency Key` can be made unique via an Airtable field setting.

These fields are **application identity keys**. Concurrent durability is proven only by **ADV-P-1** (multi-instance / multi-process races + direct base query). Duplicates under ADV-P-1 ⇒ **REQUIRES DIFFERENT DATASTORE**.

| Table | Identity / idempotency fields |
|---|---|
| People | `Person Key`, `OrgEmailKey`, `OrgExternalKey` |
| People Org Memberships | `Membership Key` |
| People Household Members | `Member Key` |
| People Relationships | `Edge Key` |
| People Program Links | `Link Key` |
| People Consents | `Consent Key` |
| People ACL Grants | `Grant Key` |
| People Merge Jobs | `Job Key` |
| People Import Jobs | `Idempotency Key` |
| People Import Row Results | `Row Key` |
| People Migration Checkpoints | `Checkpoint Key` |

`OrgEmailKey` format: `{organizationId}#{normalizedEmail}`  
`OrgExternalKey` format: `{organizationId}#{system}#{value}`  
`Job Key` format: `{organizationId}#{absorbedPersonKey}`

## People required fields (minimum)

`Person Key`, `Organization Id`, `OrgEmailKey`, `OrgExternalKey`, `Lifecycle Status`, `Updated At`

Plus application fields used by the adapter: Display Name, Primary Email, Emails JSON, Phones JSON, External Ids JSON, Merged Into Person Key, Created At, Source, etc. Full map: `PERSON_FIELDS` in `airtable-tables.ts`.

## Cert base guidance

Use a dedicated Airtable base for `PEOPLE_AIRTABLE_CERT=1` runs so production data is never polluted. Point `AIRTABLE_PAYMENTS_BASE_ID` (or cert-only override if added later) at that base for the cert window only.

## Hard stop

If ADV-P-1 fails against Airtable after unique fields + adapter compensating controls → **REQUIRES DIFFERENT DATASTORE** (do not enable People).
