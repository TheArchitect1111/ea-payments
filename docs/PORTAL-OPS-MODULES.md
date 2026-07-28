# Portal Ops Modules

Four launch modules for Website + Portal and Launch Edition tenants — shared form ledger, pack-driven CX nav, and Event Hub scheduling depth.

## Modules

| Module | Path | Purpose |
|--------|------|---------|
| **Intake** | `/portal/{slug}/intake` | Client end-user intake (not EA CTP at cc/ctp). Fixed V1 fields; staff queue. |
| **Applications** | `/portal/{slug}/apply` (public), `/portal/{slug}/applications` | Apply without login; members track status; staff review queue. |
| **Scheduling** | Event Hub → Calendar tab | Embed tenant `Booking Url` (or `CALENDLY_URL` fallback). Staff saves URL in portal. |
| **Reports** | `/portal/{slug}/reports` | Curated gallery linking Pulse, CTP BI/progress, Documents, Updates, Events. |

## Form ledger

- Store: `lib/portal-forms/store.ts` → Airtable `Portal Form Submissions`
- Kinds: `intake` \| `application`
- Statuses: `submitted` → `reviewed` → `accepted` \| `rejected`
- Bootstrap: `node scripts/ensure-portal-forms-airtable-schema.mjs`

## Industry packs

- `ctp-client` — legacy five CX destinations (flag off)
- `website-portal` — CTP five + **Intake** (Website + Portal Starter default when not real-estate)
- `real-estate` — pipeline/listings CX + **Intake**

## Certs

```bash
node scripts/test-portal-intake-cert.mjs
node scripts/test-portal-applications-cert.mjs
node scripts/test-portal-scheduling-cert.mjs
node scripts/test-portal-reports-cert.mjs
node scripts/test-event-hub-mandatory-cert.mjs
node scripts/test-real-estate-pack-cert.mjs
```

## Launch impact

Increases organizational capacity for SMB portal ops (intake, applications, booking, reports) without new microservices or RJSF — reuses platform-store, Pulse, and IndustryPack nav.
