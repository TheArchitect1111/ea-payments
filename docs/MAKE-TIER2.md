# Tier 2 — Full launch automation (Make + Stripe + Resend)

Wire payment → welcome email → Make onboarding → eSignatures → Airtable status updates.

**Health target:** `status: "full_launch_ready"` on `/api/health/launch`

---

## What ea-payments already does (no code needed)

On successful Stripe `checkout.session.completed`:

1. Writes **Client Records** in Airtable (`Onboarding Status = Not Started`)
2. Creates portal credentials (when catalog item includes portal config)
3. Sends **welcome email** via Resend
4. Sends **admin notification** email
5. POSTs to **`ONBOARDING_WEBHOOK_URL`** (Make)

eSignatures.io posts to **`/api/webhooks/esignatures`** → forwards to **`ESIGN_WEBHOOK_URL`** (Make).

---

## Step 1 — Create Make scenario: Onboarding

1. Make.com → **Create scenario**
2. Trigger: **Webhooks → Custom webhook** → copy URL → this is `ONBOARDING_WEBHOOK_URL`
3. Add modules (minimum):

| # | Module | Action |
|---|--------|--------|
| 1 | Webhook | Receive JSON |
| 2 | Airtable | **Update a record** — base: Payments, table: Client Records, record ID: `{{airtableRecordId}}` |
| 3 | Set fields | `Onboarding Status` = `In Progress` (when starting doc flow) |
| 4 | eSignatures.io | Send contract (MSA/SOW) — use template IDs from eSignatures dashboard |
| 5 | Airtable | Set `Docs Sent At` = `now`, `Onboarding Status` = `Docs Sent` |
| 6 | Optional | Email/Slack to `freedom@efficiencyarchitects.online` |

### Webhook JSON payload (from ea-payments)

```json
{
  "event": "payment.received",
  "clientName": "Jane Client",
  "email": "jane@example.com",
  "organization": "Acme Co",
  "packageName": "Simplifi",
  "amountPaid": 149,
  "paymentDate": "2026-06-22",
  "stripeTransactionId": "pi_...",
  "airtableRecordId": "recXXXXXXXX",
  "portalLoginUrl": "https://www.efficiencyarchitects.online/portal/login"
}
```

**Required Airtable fields on Client Records:** `Onboarding Status`, `Payment Received At`, `Docs Sent At`, `Docs Signed At`

Run onboarding fields script if missing:

```bat
cd ea-operating-system
set AIRTABLE_API_KEY=pat...
node scripts\setup-airtable-onboarding-fields.mjs
```

---

## Step 2 — Create Make scenario: eSign completion

1. New scenario → **Custom webhook** → copy URL → `ESIGN_WEBHOOK_URL`
2. Configure **eSignatures.io** callback URL (not Make directly):

   `https://ea-payments.vercel.app/api/webhooks/esignatures`

3. Make modules:

| # | Module | Action |
|---|--------|--------|
| 1 | Webhook | Receive forwarded payload |
| 2 | Router | Branch on `status` / signed event |
| 3 | Airtable | Find/update Client Record by email or contract metadata |
| 4 | Set | `Onboarding Status` = `Docs Signed`, `Docs Signed At` = `now` |

### Forwarded payload shape

```json
{
  "event": "esignatures.callback",
  "receivedAt": "2026-06-22T12:00:00.000Z",
  "status": "signed",
  "contractId": "...",
  "signerEmail": "jane@example.com",
  "signerName": "Jane Client"
}
```

(Additional fields depend on eSignatures.io callback body — map in Make.)

---

## Step 3 — Vercel env vars

```bat
cd ea-payments
scripts\run-tier2-setup.bat
```

Or manually:

```bat
vercel env add ONBOARDING_WEBHOOK_URL production --value "https://hook.us1.make.com/..." --yes
vercel env add ESIGN_WEBHOOK_URL production --value "https://hook.us1.make.com/..." --yes
vercel deploy --prod --yes
```

---

## Step 4 — Test webhooks (dry run)

```powershell
curl.exe -X POST "https://ea-payments.vercel.app/api/health/test-webhooks" `
  -H "x-launch-setup-key: YOUR_LAUNCH_SETUP_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"dryRun\":true,\"target\":\"both\"}"
```

Fire real test pings to Make (safe test payload):

```powershell
curl.exe -X POST "https://ea-payments.vercel.app/api/health/test-webhooks" `
  -H "x-launch-setup-key: YOUR_LAUNCH_SETUP_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"dryRun\":false,\"target\":\"both\"}"
```

Check **Make scenario history** for two green runs.

---

## Step 5 — Stripe live checkout test

1. Open https://ea-payments.vercel.app/checkout
2. Select **Simplifi Early Access** (or smallest live package)
3. Pay with a real card (you can refund in Stripe dashboard)
4. Verify:
   - Client Records row created with `Payment Received At`
   - Welcome email received
   - Make onboarding scenario ran (history)
   - Vercel function logs: no `[make-webhooks] ONBOARDING_WEBHOOK_URL is not set`

Local checklist:

```bat
npm run test:tier2
```

---

## Rollback

- Disable Make scenarios
- `vercel env rm ONBOARDING_WEBHOOK_URL production`
- `vercel env rm ESIGN_WEBHOOK_URL production`
- Redeploy

---

## Related docs

- `ea-operating-system/docs/ecosystem-do-now.md` — Step 4–7
- `ea-operating-system/docs/ecosystem-setup-runbook.md` — §4–5
- `docs/LAUNCH-100.md` — manual checklist
