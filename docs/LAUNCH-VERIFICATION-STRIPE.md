# EA Launch Verification — Stripe $1 Production Smoke Test

Verify the **complete production payment workflow** before accepting live customers.

| Field | Value |
|-------|-------|
| Product | EA Launch Verification |
| Price | $1.00 USD one-time |
| Checkout | `/launch-verification` |
| Webhook | Existing `/api/webhooks/stripe` |

---

## What happens on successful payment

1. **Airtable** — Client Records row created/updated  
   - `Package Purchased` = `Launch Verification`  
   - `Onboarding Status` = `Launch Verification`  
   - `Payment Received At` set  
2. **Resend** — Welcome email to payer  
3. **Resend** — Admin notification to `ADMIN_NOTIFICATION_EMAIL`  
4. **Make** — `ONBOARDING_WEBHOOK_URL` fired (if configured)  
5. **Pulse** — `launch.verification.completed` + onboarding task event  
6. **Logs** — Structured `[launch-verification]` transaction log in Vercel

---

## Required environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` | Yes | Stripe API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe.js (if used client-side) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signature verification |
| `STRIPE_PRICE_LAUNCH_VERIFICATION` | Recommended | Stripe Price ID for $1 product |
| `STRIPE_PRODUCT_LAUNCH_VERIFICATION` | Optional | Product ID (script idempotency) |
| `AIRTABLE_API_KEY` | Yes | Client record write |
| `AIRTABLE_PAYMENTS_BASE_ID` | Yes | Payments base |
| `RESEND_API_KEY` | Yes | Welcome + admin email |
| `RESEND_FROM_EMAIL` | Yes | Verified sender |
| `ADMIN_NOTIFICATION_EMAIL` | Yes | Admin alert recipient |
| `ONBOARDING_WEBHOOK_URL` | Recommended | Make onboarding scenario |
| `PULSE_EVENTS_TABLE` | Recommended | Pulse Events table name |
| `NEXT_PUBLIC_BASE_URL` | Yes | Success/cancel redirect URLs |

---

## Step 1 — Create Stripe product + price

```powershell
cd ea-payments
npm run setup:launch-verification
```

Or with production key:

```powershell
vercel env run -e production -- node scripts/create-stripe-launch-verification.mjs
```

Copy the printed Price ID to Vercel:

```powershell
vercel env add STRIPE_PRICE_LAUNCH_VERIFICATION production --value "price_..." --yes
vercel env add STRIPE_PRODUCT_LAUNCH_VERIFICATION production --value "prod_..." --yes
```

Redeploy Production.

---

## Step 2 — Airtable single-select options

In **Client Records** (`tblEtkE88ADyIitnm`), add if missing:

- **Package Purchased** → option `Launch Verification`
- **Onboarding Status** → option `Launch Verification`

Airtable `typecast: true` may auto-create options; confirm in base UI.

---

## Step 3 — Stripe webhook (production)

Stripe Dashboard → Webhooks → endpoint:

```
https://www.efficiencyarchitects.online/api/webhooks/stripe
```

Events: `checkout.session.completed`

Copy signing secret → Vercel `STRIPE_WEBHOOK_SECRET` → redeploy.

---

## Stripe CLI — local testing

Install [Stripe CLI](https://stripe.com/docs/stripe-cli).

```powershell
# Login
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy whsec_... to .env.local as STRIPE_WEBHOOK_SECRET
```

Run checkout locally:

```powershell
npm run dev
# Open http://localhost:3000/launch-verification
```

Test card: `4242 4242 4242 4242` · any future expiry · any CVC.

Trigger webhook manually (after a real session):

```powershell
stripe trigger checkout.session.completed
```

Note: `stripe trigger` uses fixtures — for full EA flow, complete checkout at `/launch-verification`.

---

## Production testing checklist

1. Open https://www.efficiencyarchitects.online/launch-verification  
2. Pay $1.00 with real or test card (match Stripe mode: live key = live card)  
3. Confirm success page loads  
4. **Airtable** — new row, Package = Launch Verification  
5. **Email** — welcome + admin notification  
6. **Make** — onboarding scenario history shows run  
7. **Pulse Events** — `launch.verification.completed` row  
8. **Vercel logs** — `[launch-verification] payment.processed`  
9. **Launch Command Center** — `/launch` score unchanged logic; friend test item can be marked done manually  

See also: `docs/FRIEND-TESTING-CHECKLIST.md`

---

## Deployment steps

1. Merge code to `master`  
2. `npm run setup:launch-verification` (or use existing Stripe price)  
3. Set env vars on Vercel Production (table above)  
4. Redeploy `ea-payments`  
5. Confirm webhook endpoint in Stripe Dashboard  
6. Run one $1 verification payment  
7. Optional: refund test payment in Stripe Dashboard  

---

## Rollback

| Action | Command / step |
|--------|----------------|
| Disable checkout | Remove `STRIPE_PRICE_LAUNCH_VERIFICATION` from Vercel or archive price in Stripe |
| Stop webhook processing | Disable webhook in Stripe Dashboard |
| Revert code | Deploy previous Vercel deployment from Deployments tab |
| Remove test Airtable rows | Delete Launch Verification test rows manually |
| Refund payment | Stripe Dashboard → Payments → Refund |

No database migration required — uses existing Client Records + Pulse Events tables.

---

## URLs

| Page | URL |
|------|-----|
| Checkout | `/launch-verification` |
| Success | `/launch-verification/success` |
| Cancel | `/launch-verification/cancel` |
| API | `POST /api/checkout/launch-verification` |
| Webhook | `POST /api/webhooks/stripe` |
