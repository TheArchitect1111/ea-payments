# Make Scenario — EA Contract Signed

**Scenario name:** `EA Contract Signed`  
**Purpose:** When a client signs MSA/SOW, update Airtable and log a Pulse event.

---

## Flow

```
[1] Webhooks → Custom webhook          (ESIGN_WEBHOOK_URL)
[2] Airtable → Search records          (Client Records by signer email)
[3] Airtable → Update record           (Onboarding Status, Docs Signed At)
[4] Airtable → Create record           (Pulse Events — optional)
```

---

## Step 1 — Custom webhook

1. Make.com → **Create scenario** → name: **EA Contract Signed**
2. Module 1: **Webhooks → Custom webhook**
3. Copy URL → Vercel env **`ESIGN_WEBHOOK_URL`**
4. Turn scenario **ON**

eSignatures.io does **not** call this URL directly. Flow:

```
eSignatures.io → ea-payments /api/webhooks/esignatures → ESIGN_WEBHOOK_URL (this scenario)
```

---

## Step 2 — Locate Client Record

**Module:** Airtable → **Search records**

| Setting | Value |
|---------|-------|
| Base | Payments (`appv0YoLIMY45fmDA`) |
| Table | Client Records (`tblEtkE88ADyIitnm`) |
| Formula | `{Email} = '{{signerEmail}}'` or map from payload |

Payload fields (from ea-payments forward):

```json
{
  "event": "esignatures.callback",
  "receivedAt": "2026-06-22T12:00:00.000Z",
  "status": "signed",
  "signerEmail": "client@example.com",
  "signerName": "Jane Client",
  "contractId": "..."
}
```

Map `signerEmail` from the eSignatures callback body (field names may vary — inspect first webhook run in Make history).

---

## Step 3 — Update Onboarding Status

**Module:** Airtable → **Update a record**

| Field | Value |
|-------|-------|
| Record ID | From search module |
| Onboarding Status | `Docs Signed` |
| Docs Signed At | `now` |

---

## Step 4 — Log Pulse Event (recommended)

**Module:** Airtable → **Create a record** → table **Pulse Events**

| Field | Example |
|-------|---------|
| Event Type | `onboarding.docs_signed` |
| Title | `Docs signed — {{signerName}}` |
| Product | `ea-platform` |
| Priority | `normal` |
| Detail | `Contract {{contractId}} signed` |

---

## Step 5 — Vercel

```bat
vercel env add ESIGN_WEBHOOK_URL production --value "https://hook.us1.make.com/YOUR_TOKEN" --yes
```

Redeploy Production.

---

## Step 6 — Test

```powershell
curl.exe -X POST "https://www.efficiencyarchitects.online/api/health/test-webhooks" `
  -H "x-launch-setup-key: YOUR_LAUNCH_SETUP_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"target\":\"esign\",\"dryRun\":false}"
```

Check Make scenario history for a green run.

---

## Launch checklist

- [ ] Scenario **EA Contract Signed** created and ON
- [ ] `ESIGN_WEBHOOK_URL` on Vercel Production
- [ ] eSignatures callback → `https://efficiencyarchitects.online/api/webhooks/esignatures` (apex — not www)
- [ ] Command Center: `ESIGN_WEBHOOK_URL` probe HTTP 200
- [ ] Test sign flow updates Client Records + Pulse Events
