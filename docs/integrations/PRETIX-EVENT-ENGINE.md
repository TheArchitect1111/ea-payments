# pretix Event Engine (Event Hub™)

**Status:** Adopted 2026-07-25 — **disabled until configured**  
**Extension point:** Event Hub module (`events`) + Pulse bus + webhook route  
**Gate:** [INTEGRATION-GATE.md](../INTEGRATION-GATE.md)

## What pretix owns

- Event catalog (tickets, quotas, add-ons)
- Registration checkout
- Payments
- Attendee confirmation emails / tickets

## What EA owns

- Portal Event Hub list + Register deep-links
- Event Hub tabs: **Calendar** | **Events** | **My registrations** (single `events` entitlement)
- Staff publish of pretix shop URLs per portal slug
- Webhook → Pulse / portal notify (`event.registration.placed` | `event.registration.confirmed`)
- Portal registration ledger (Airtable **Portal Event Registrations** when configured; else `.data/portal-event-registrations.json`)
- T-7 / T-1 / event-day reminders via cron (`event.registration.reminder`)

## Why not rebuild ticketing in EA

Camps and tournaments need inventory, refunds, tax, PDF tickets, and payment reconciliation. pretix Hosted is that engine; EA stays the client OS.

## Configure (production)

1. Create the event in pretix Hosted (or your pretix instance).
2. Copy the public shop URL (`https://…/org/event/`).
3. In the portal as **staff+**, open Event Hub → **Events** tab → **Staff · pretix events** → paste URL + title → Publish.
   - Or seed via env (ephemeral on Vercel without durable store):

```bash
PRETIX_EVENTS_JSON='[{"portalSlug":"demo-client","title":"Summer Camp","shopUrl":"https://pretix.eu/org/camp/","pretixEventSlug":"camp","status":"published"}]'
```

4. Webhook (required for Pulse + ledger):
   - Target: `https://PRETIX_WEBHOOK_USER:PRETIX_WEBHOOK_SECRET@efficiencyarchitects.online/api/webhooks/pretix`
   - Default user if unset: `pretix`
   - Actions: `pretix.event.order.placed`, `pretix.event.order.paid` (and related paid/canceled variants)
5. Env:

| Variable | Purpose |
|---|---|
| `PRETIX_WEBHOOK_SECRET` | Basic Auth password (and optional Bearer / proxy HMAC) |
| `PRETIX_WEBHOOK_USER` | Basic Auth user (default `pretix`) |
| `PRETIX_EVENTS_JSON` | Optional seed list of portal events |
| `PRETIX_ALLOW_INSECURE_WEBHOOK=1` | Non-production only — accept unsigned webhooks |
| `CRON_SECRET` | Bearer for `/api/cron/event-registration-reminders` |
| `AIRTABLE_PORTAL_PRETIX_EVENTS_TABLE` | Default `Portal Pretix Events` — durable pretix event catalog |
| `AIRTABLE_PORTAL_EVENT_REGISTRATIONS_TABLE` | Default `Portal Event Registrations` — registration ledger |
| `AIRTABLE_API_KEY` + platform base | Required for multi-instance durability via `platformStoreConfigured()` |

## Durable store (Airtable)

When `platformStoreConfigured()` is true, pretix events and registration rows persist to Airtable instead of local JSON:

| Table | Upsert key | Notes |
|---|---|---|
| `Portal Pretix Events` | `Event ID` | Staff publish + webhook matching |
| `Portal Event Registrations` | `Registration Key` | `{portalSlug}:{orderCode}:{pretixEventSlug\|\|_}` |

**Bootstrap schema:**

```bash
node scripts/ensure-event-hub-airtable-schema.mjs
```

Local / unconfigured fallback remains `.data/portal-pretix-events.json` and `.data/portal-event-registrations.json` (memory on Vercel tmp).

## Ops checklist

1. Run `node scripts/ensure-event-hub-airtable-schema.mjs` once per base.
2. Confirm `AIRTABLE_API_KEY` + platform base env on production.
3. Create pretix event + copy shop URL.
4. Staff publish in portal Event Hub (or upsert via admin tooling).
5. Configure pretix webhook with Basic Auth secret.
6. Place a test order → confirm row in **Portal Event Registrations**.
7. Dry-run reminders cron (see below).
8. Cert: `node scripts/test-event-hub-mandatory-cert.mjs`

## Architecture notes

- Fail closed: no events configured → Event Hub Calendar tab remains reviews/Calendly only (no empty pretix chrome).
- Do **not** embed pretix admin UI in Amplifi or Mission Control.
- Stripe remains for subscriptions; pretix handles event registration payments.

## Verification

```bash
node scripts/test-pretix-event-hub-contract.mjs
node scripts/test-event-hub-mandatory-cert.mjs
```

Dry-run registration reminders (non-production or with `CRON_SECRET`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://efficiencyarchitects.online/api/cron/event-registration-reminders?dryRun=1"
```

GET `/api/webhooks/pretix` should report route health + integration config.
