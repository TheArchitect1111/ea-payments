# CTP Sellable Close Runbook

**One page:** intake → admin close → Stripe → fulfill → portal CX verify → welcome email.

**Launch impact:** Operator-proof CTP money loop without founder dependency.

---

## 1. Intake (canonical)

| Step | Action |
|------|--------|
| URL | **https://cc.efficiencyarchitects.online/ctp** (canonical — do not use `/ctp-intake` or `/discover`) |
| Verify | Submission appears in `/admin/ctp` within minutes |
| Preflight | `npm run launch:preflight` (soft-fail on ctp-spine is OK until copy contracts re-align) |

See [CTP-CLOSE-SOP.md](./CTP-CLOSE-SOP.md) for desk-level detail.

---

## 2. Admin close (Commercial → Paid)

1. Open `/admin/ctp` → expand submission.
2. Confirm **Commercial** badge (proposal + Client Record linked).
3. **Mark ready for review** when studio work is ready.
4. **Approve & send proposal** — client receives email; status → Approved.
5. Client pays via proposal checkout → Stripe webhook fires fulfillment.
6. After paid: **Approve & reveal** when intentional.
7. Implementation package: Make onboarding + eSignatures use apex callback  
   `https://efficiencyarchitects.online/api/webhooks/esignatures` (never `www.`).

---

## 3. Stripe → fulfill

| Path | Handler |
|------|---------|
| Proposal payment | `app/api/webhooks/stripe/route.ts` → `handleProposalPayment` → `fulfillPaidClient` |
| Website + Portal auto | Same webhook → `website-portal-auto` fulfillment |

Verify:

```bash
node scripts/test-fulfill-paid-client.mjs
node scripts/test-website-portal-starter.mjs
```

Watch Client Record → **Paid** badge and portal slug creation.

---

## 4. Portal CX — five-nav verify

After fulfillment, sign in as client at `/portal/login`:

| Nav item | Expected (CTP Client Experience) |
|----------|----------------------------------|
| Your Project | `/portal/{slug}/ctp/progress` |
| Documents | `/portal/{slug}/ctp/documents` |
| Contact | `/portal/{slug}/ctp/messages` |
| Help | `/portal/{slug}/ctp/support` |
| Journey | `/portal/{slug}/ctp` |

**Must NOT appear in primary chrome:** Pulse, Simplifi, Amplifi, Connect (unless separately entitled).

Real-estate clients with keyword hints may resolve **real-estate** pack instead — see `lib/portal-universal/packs/real-estate.ts`.

---

## 5. Welcome email checks

| Check | Pass criteria |
|-------|---------------|
| Email sent | Resend delivery (requires DNS — ops) |
| Magic link | `magicLoginUrl` in welcome when `magicLinkConfigured()` |
| Portal login | Temp credentials or magic link lands on CTP workspace |
| Site URL | Website + Portal packages include `/sites/{slug}` when provisioned |

```bash
node scripts/test-factory-launch-email.mjs
```

---

## Quick command block

```bash
npm run launch:preflight
node scripts/test-fulfill-paid-client.mjs
node scripts/test-canonical-ctp-intake.mjs
```

**Related:** [CTP-MONEY-LOOP-CERT-CHECKLIST.json](./audits/CTP-MONEY-LOOP-CERT-CHECKLIST.json)
