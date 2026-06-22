# Friend Testing Checklist — EA Payments Launch

Run one complete payment as a trusted tester before public launch.

**Checkout URL:** https://www.efficiencyarchitects.online/checkout  
**Health:** https://www.efficiencyarchitects.online/api/health/launch  
**Command Center:** https://www.efficiencyarchitects.online/launch

---

## Pre-flight (5 min)

- [ ] Launch Command Center score ≥ 80
- [ ] `ONBOARDING_WEBHOOK_URL` probe = HTTP 200
- [ ] `RESEND_FROM_EMAIL` = full address e.g. `noreply@efficiencyarchitects.online`
- [ ] Resend domain **verified** at [resend.com/domains](https://resend.com/domains)
- [ ] Demo client exists (`demoClient: true` on health launch)

---

## Step 1 — Make payment

1. Open **/checkout** on production (canonical domain).
2. Select a package (e.g. Simplifi).
3. Complete Stripe checkout with a **real card** (or Stripe test mode if still on test keys).
4. Note the confirmation page and Stripe payment ID.

**Pass:** Checkout completes without error.

---

## Step 2 — Verify Airtable row

1. Open Airtable → Payments base → **Client Records** (`tblEtkE88ADyIitnm`).
2. Find row by tester email.
3. Confirm:

| Field | Expected |
|-------|----------|
| Email | Tester email |
| Package | Purchased package |
| Onboarding Status | `Not Started` or `In Progress` (after Make runs) |
| Payment Received At | Populated |
| Stripe Transaction ID | Matches Stripe |

**Pass:** New or updated client record within 2 minutes.

---

## Step 3 — Verify welcome email

1. Check tester inbox (and spam).
2. Subject类似: *You are in, {FirstName}. Here is what happens next.*
3. Email includes portal login link.

**Pass:** Welcome email received within 5 minutes.

---

## Step 4 — Verify Make history

1. Make.com → **EA Onboarding Webhook** scenario.
2. Open **History** — green run at payment time.
3. Payload includes `clientEmail`, `packagePurchased`, `portalSlug` (if portal provisioned).

**Pass:** At least one successful onboarding webhook run.

---

## Step 5 — Verify onboarding status

1. Return to Airtable Client Records.
2. After Make processes (may take 1–5 min):

| Field | Expected after onboarding Make |
|-------|----------------------------------|
| Onboarding Status | `In Progress` or `Docs Sent` |
| Docs Sent At | Set when eSign flow runs |

**Pass:** Status advanced from `Not Started` (once Make + eSign configured).

---

## Step 6 — Verify Pulse event

1. Airtable → **Pulse Events** table.
2. Look for event tied to payment or onboarding (e.g. `onboarding.*` or payment received).

**Pass:** At least one Pulse row for the test client or payment event.

---

## Sign-off

| Role | Name | Date | Pass/Fail |
|------|------|------|-----------|
| Tester | | | |
| EA ops | | | |

---

## If something fails

| Symptom | Check |
|---------|-------|
| No Airtable row | Vercel logs → Stripe webhook; `AIRTABLE_API_KEY` |
| No email | `RESEND_FROM_EMAIL` format + domain verified |
| No Make run | `ONBOARDING_WEBHOOK_URL` + scenario ON |
| 404 on Make | Re-copy webhook URL from Make module |
| Health not green | `/api/health/command-center` → `recommendedNextAction` |

---

## After friend test

1. Remove or rotate `LAUNCH_SETUP_KEY` from Vercel.
2. Optionally refund Stripe test payment.
3. Mark `stripe_live_checkout` complete in your launch notes.
