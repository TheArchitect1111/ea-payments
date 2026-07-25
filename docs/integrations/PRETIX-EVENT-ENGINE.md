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
- Staff publish of pretix shop URLs per portal slug
- Webhook → Pulse / portal notify (`event.registration.placed` | `event.registration.confirmed`)

## Why not rebuild ticketing in EA

Camps and tournaments need inventory, refunds, tax, PDF tickets, and payment reconciliation. pretix Hosted is that engine; EA stays the client OS.

## Configure (production)

1. Create the event in pretix Hosted (or your pretix instance).
2. Copy the public shop URL (`https://…/org/event/`).
3. In the portal as **staff+**, open Event Hub → **Staff · pretix events** → paste URL + title → Publish.
   - Or seed via env (ephemeral on Vercel without durable store):

```bash
PRETIX_EVENTS_JSON='[{"portalSlug":"demo-client","title":"Summer Camp","shopUrl":"https://pretix.eu/org/camp/","pretixEventSlug":"camp","status":"published"}]'
```

4. Webhook (required for Pulse):
   - Target: `https://PRETIX_WEBHOOK_USER:PRETIX_WEBHOOK_SECRET@efficiencyarchitects.online/api/webhooks/pretix`
   - Default user if unset: `pretix`
   - Actions: `pretix.event.order.placed`, `pretix.event.order.paid` (and related paid variants)
5. Env:

| Variable | Purpose |
|---|---|
| `PRETIX_WEBHOOK_SECRET` | Basic Auth password (and optional Bearer / proxy HMAC) |
| `PRETIX_WEBHOOK_USER` | Basic Auth user (default `pretix`) |
| `PRETIX_EVENTS_JSON` | Optional seed list of portal events |
| `PRETIX_ALLOW_INSECURE_WEBHOOK=1` | Non-production only — accept unsigned webhooks |

## Architecture notes

- Store: `.data/portal-pretix-events.json` locally; memory (+ tmp) on Vercel. Prefer `PRETIX_EVENTS_JSON` or future Airtable/platform-store for multi-instance durability.
- Fail closed: no events configured → Event Hub remains reviews/Calendly only (no empty pretix chrome).
- Do **not** embed pretix admin UI in Amplifi or Mission Control.

## Verification

```bash
node scripts/test-pretix-event-hub-contract.mjs
```

GET `/api/webhooks/pretix` should report route health + integration config.
