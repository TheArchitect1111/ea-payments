# Pulse™ ingestion contract (satellites → EA platform)

Satellite apps (CPR, SisterHub, BrotherHub) POST normalized events to the **ea-payments** Pulse API. Events persist to Airtable `Pulse Events` when `PULSE_EVENTS_TABLE` is configured on the platform.

## Endpoint

```
POST https://www.efficiencyarchitects.online/api/pulse/events
```

Preview: `https://ea-payments.vercel.app/api/pulse/events`

## Authentication

| Header | Value |
|--------|--------|
| `x-ea-pulse-key` | Same as `EA_CAPTURE_API_KEY` / `PULSE_INGEST_KEY` on ea-payments Vercel |

Alternative header (capture extension): `x-ea-capture-key`

## Request body

```json
{
  "product": "cpr",
  "type": "apply.submitted",
  "title": "CPR apply — Jane Athlete",
  "detail": "jane@example.com",
  "priority": "medium",
  "href": "https://cpr-site.vercel.app/portal/athlete/jane-a",
  "tenantId": "jane-a",
  "objectId": "recXXXXXXXX"
}
```

### Required fields

- `product` — `ea-platform` | `cpr` | `sisterhub` | `brotherhub` | `simplifi` | `magnifi` | `amplifi` | `update-hub` | `pulse`
- `type` — see supported types in `ea-payments/lib/pulse-bus.ts`
- `title` — short human-readable headline

### Optional fields

- `detail`, `priority`, `href`, `tenantId`, `objectId`, `metadata`

## Supported event types (platform)

| Type | Emitter |
|------|---------|
| `assessment.submitted` | EA assessment form |
| `apply.submitted` | CPR apply (reference implementation) |
| `payment.received` | Stripe webhook |
| `launch.verification.completed` | Launch Verification flow |
| `portal.login` | Client portal login |
| `capture.completed` | Simplifi capture pipeline |
| `update.submitted` | Update Hub content requests |
| `onboarding.blocked` | Failed Airtable write after payment |

## Satellite env vars (CPR example)

| Variable | Example |
|----------|---------|
| `EA_PULSE_INGEST_URL` | `https://www.efficiencyarchitects.online/api/pulse/events` |
| `EA_CAPTURE_API_KEY` | Same secret as platform `EA_CAPTURE_API_KEY` |

Implementation: `cpr-site/lib/ea-pulse-forward.ts` — called after successful apply.

## Verification

1. Submit CPR apply or EA assessment on production/preview.
2. Check Airtable **Pulse Events** for new row within ~30s.
3. Check `/admin/master` Attention Center for high/critical events.

## Failure behavior

- Emitters should **not** fail the user flow if Pulse POST fails (log warning only).
- Platform `emitPulseEvent` always returns `{ ok: true }` to callers; Airtable failures are logged server-side.
