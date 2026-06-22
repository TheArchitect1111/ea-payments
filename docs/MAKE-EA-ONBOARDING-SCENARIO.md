# Make.com scenario: EA Onboarding Webhook

**Type:** Standard scenario (not AI Agent)  
**Scenario name:** `EA Onboarding Webhook`  
**Purpose:** When a client pays on ea-payments, update Airtable and (later) send MSA/SOW for signature.

---

## Flow overview

```
[1] Webhooks → Custom webhook
        ↓
[2] Airtable → Update a record  (Onboarding Status = In Progress)
        ↓
[3] eSignatures → Send MSA/SOW   (add after eSign account is ready)
        ↓
[4] Airtable → Update a record  (Onboarding Status = Docs Sent, Docs Sent At = now)
```

Keep modules **deterministic**. Do not use Make AI Agent for v1.

---

## Webhook payload (from ea-payments)

After Stripe checkout, ea-payments POSTs JSON like this:

```json
{
  "event": "payment.received",
  "airtableRecordId": "recXXXXXXXXXXXXXX",
  "clientName": "Jane Client",
  "clientEmail": "jane@example.com",
  "packagePurchased": "Simplifi",
  "portalSlug": "acme-co-a1b2c3",
  "organization": "Acme Co",
  "amountPaid": 149,
  "paymentDate": "2026-06-22",
  "stripeTransactionId": "pi_...",
  "portalLoginUrl": "https://www.efficiencyarchitects.online/portal/login"
}
```

**Make mapping — use these field names:**

| Make map from | Description |
|---------------|-------------|
| `airtableRecordId` | Client Records row to update |
| `clientName` | Display name |
| `clientEmail` | Signer + portal username |
| `packagePurchased` | Package label (e.g. Simplifi) |
| `portalSlug` | Portal URL slug (may be empty if no portal provisioned) |

Legacy aliases `email` and `packageName` are also sent for older scenarios.

---

## Step 1 — Custom webhook

1. Open https://www.make.com/en/login  
2. **Create a new scenario** (not AI Agent)  
3. Name it: **EA Onboarding Webhook**  
4. Click **+** → search **Webhooks** → **Custom webhook**  
5. Click **Add** → **Save** (Make generates a URL)  
6. **Copy the webhook URL** (starts with `https://hook.us1.make.com/` or similar)

**This URL = Vercel env var `ONBOARDING_WEBHOOK_URL`**

Add on Vercel:  
https://vercel.com/the-architects-projects-cc813778/ea-payments/settings/environment-variables

Then **Redeploy** ea-payments.

---

## Step 2 — First Airtable update

1. Click **+** after the webhook module  
2. Search **Airtable** → **Update a record**  
3. **Connection:** Use your Airtable PAT (same token as ea-payments, with access to Payments base)  
   - If 403: Make → Connections → Reauthorize  
4. **Base:** Efficiency Architects - Payments & Clients  
5. **Table:** Client Records  
6. **Record ID:** map from webhook → `airtableRecordId`  
7. **Fields to update:**

| Field | Value |
|-------|--------|
| Onboarding Status | `In Progress` |

8. **Save** the module

**Done when:** Module shows green check after a test run.

---

## Step 3 — eSignatures (add later)

Skip until eSignatures.io is set up (MSA + SOW templates uploaded).

1. Click **+** after Step 2  
2. Search **eSignatures** (or HTTP if no native module)  
3. Action: **Send contract** / send for signature  
4. **Template:** MSA and/or SOW (template IDs from eSignatures dashboard)  
5. **Recipient email:** map `clientEmail` from webhook  
6. **Signer name:** map `clientName`  

**eSignatures callback URL** (in eSignatures.io dashboard, not Make):

`https://ea-payments.vercel.app/api/webhooks/esignatures`

That route forwards to your separate **ESIGN_WEBHOOK_URL** scenario (Item 4 in launch checklist).

---

## Step 4 — Second Airtable update

1. Click **+** after eSignatures module  
2. **Airtable** → **Update a record** (same base/table)  
3. **Record ID:** `airtableRecordId` (from webhook, same as Step 2)  
4. **Fields:**

| Field | Value |
|-------|--------|
| Onboarding Status | `Docs Sent` |
| Docs Sent At | `now` (use Make date function or current timestamp) |

---

## Step 5 — Turn scenario ON

1. Bottom-left toggle: **Scheduling ON** / scenario **ON**  
2. **Save** the scenario  

---

## Test without a real payment

After `ONBOARDING_WEBHOOK_URL` is on Vercel and redeployed:

```powershell
curl.exe -X POST "https://ea-payments.vercel.app/api/health/test-webhooks" `
  -H "x-launch-setup-key: YOUR_LAUNCH_SETUP_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"dryRun\":false,\"target\":\"onboarding\"}"
```

Open Make → **EA Onboarding Webhook** → **History** → confirm a successful run.

Use a real `airtableRecordId` from Client Records for a full Airtable test (replace in payload via Make’s “Run once” with custom data).

---

## Required Airtable fields (Client Records)

| Field | Type |
|-------|------|
| Onboarding Status | Single select: Not Started, In Progress, Docs Sent, Docs Signed, Complete |
| Docs Sent At | Date/time |
| Payment Received At | Date/time (set by ea-payments on payment) |
| Portal Slug | Text |

If missing, run:

```bat
cd ea-operating-system
set AIRTABLE_API_KEY=pat...
node scripts\setup-airtable-onboarding-fields.mjs
```

---

## Checklist

- [ ] Scenario named **EA Onboarding Webhook**  
- [ ] Module 1: Custom webhook — URL copied  
- [ ] `ONBOARDING_WEBHOOK_URL` set on Vercel Production  
- [ ] ea-payments redeployed  
- [ ] Module 2: Airtable update → In Progress  
- [ ] (Later) Module 3: eSignatures MSA/SOW → `clientEmail`  
- [ ] (Later) Module 4: Airtable → Docs Sent + Docs Sent At  
- [ ] Scenario **ON**  
- [ ] Test run visible in Make history  

---

## Related

- Tier 2 overview: `MAKE-TIER2.md`  
- Vercel env batch: `scripts/run-tier2-setup.bat`  
- Health check: https://ea-payments.vercel.app/api/health/launch  
