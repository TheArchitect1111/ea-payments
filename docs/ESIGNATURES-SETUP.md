# eSignatures.io Setup — EA Payments Launch

Complete this before the **EA Contract Signed** Make scenario can run end-to-end.

---

## 1. Create account

1. Go to [https://esignatures.io](https://esignatures.io) and create an account.
2. Note your API key (for Make modules later).

---

## 2. Upload templates

### MSA (Master Services Agreement)

1. Dashboard → **Templates** → **Upload**
2. Upload your MSA Word file (`.docx`)
3. Copy the **Template ID** → save as `ESIGNATURES_MSA_TEMPLATE_ID`

### SOW (Statement of Work)

1. Upload SOW Word file
2. Copy **Template ID** → save as `ESIGNATURES_SOW_TEMPLATE_ID`

---

## 3. Callback URL (required)

eSignatures.io must POST signed-document events to **ea-payments**, not directly to Make.

**Production callback URL (apex only — never www):**

```
https://efficiencyarchitects.online/api/webhooks/esignatures
```

`www.efficiencyarchitects.online` is the CRA marketing site and will **404** this route.

In eSignatures.io → **Settings** → **Webhooks** (or per-template callback):

- Set callback URL to the apex value above
- ea-payments forwards the payload to `ESIGN_WEBHOOK_URL` (Make)

Verify route is live:

```powershell
curl.exe -s "https://efficiencyarchitects.online/api/webhooks/esignatures"
curl.exe -s -o NUL -w "%{http_code}" -X POST "https://efficiencyarchitects.online/api/webhooks/esignatures" -H "Content-Type: application/json" -d "{\"test\":true}"
```

Expected: **200** (or route responds — not 404).

---

## 4. Vercel environment variables

```bat
vercel env add ESIGNATURES_MSA_TEMPLATE_ID production --value "your-msa-template-id" --yes
vercel env add ESIGNATURES_SOW_TEMPLATE_ID production --value "your-sow-template-id" --yes
vercel env add ESIGN_WEBHOOK_URL production --value "https://hook.us1.make.com/..." --yes
```

Redeploy Production after adding vars.

| Variable | Purpose |
|----------|---------|
| `ESIGNATURES_MSA_TEMPLATE_ID` | MSA template in eSignatures dashboard |
| `ESIGNATURES_SOW_TEMPLATE_ID` | SOW template in eSignatures dashboard |
| `ESIGN_WEBHOOK_URL` | Make **EA Contract Signed** scenario webhook URL |

---

## 5. Make integration (onboarding scenario)

The **EA Onboarding Webhook** Make scenario sends contracts via eSignatures.io using template IDs from your eSignatures account. Map:

- Signer email → `clientEmail` from webhook payload
- Template → MSA and/or SOW IDs

See `docs/MAKE-EA-ONBOARDING-SCENARIO.md` for the payment → docs flow.

---

## 6. Launch Command Center checks

After setup, these should show **complete**:

- `eSignatures callback route`
- `MSA + SOW template IDs`
- `ESIGN_WEBHOOK_URL` (Make probe HTTP 200)

```powershell
curl.exe -s "https://www.efficiencyarchitects.online/api/health/command-center" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);j.items.filter(i=>i.category==='eSignatures'||i.name.includes('ESIGN')).forEach(i=>console.log(i.name,i.status,i.message));});"
```

---

## Rollback

- Remove callback URL in eSignatures.io
- `vercel env rm ESIGNATURES_MSA_TEMPLATE_ID production`
- `vercel env rm ESIGNATURES_SOW_TEMPLATE_ID production`
- Redeploy
