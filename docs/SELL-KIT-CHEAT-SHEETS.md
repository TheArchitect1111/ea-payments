# Sell Kit — Cheat Sheets

Quick operator references by SKU. Link to full SOPs where noted.

---

## Website + Portal

1. Client buys at `/buy` (website_portal_starter).
2. Stripe webhook fulfills portal + site automatically.
3. Client receives welcome email with magic link.
4. Verify `/sites/{slug}` live + portal CX (five-nav + Intake when `website-portal` pack).
5. **Do not** enable Amplifi/Simplifi unless upsold.
6. Optional: run Portal Ops certs (intake, applications, scheduling, reports).

**Scripts:** `test-website-portal-golden-path-cert.mjs`, `test-portal-intake-cert.mjs`, `test-fulfill-paid-client.mjs`

---

## CTP Implementation

1. Intake: https://cc.efficiencyarchitects.online/ctp
2. `/admin/ctp` → approve proposal → client pays.
3. Approve & reveal when ready.
4. Verify five-nav + CTP workspace.

**Full runbook:** [CTP-SELLABLE-CLOSE-RUNBOOK.md](./CTP-SELLABLE-CLOSE-RUNBOOK.md)

---

## Simplifi / Amplifi Growth

See **[AMPLIFI-MAGNIFI-CLIENT-CHEAT-SHEET.md](./AMPLIFI-MAGNIFI-CLIENT-CHEAT-SHEET.md)** — entitle `simplifi` + `amplifi`, pilot smoke, support triage.

```bash
node scripts/pilot-amplifi-magnifi-client.mjs --list
node scripts/pilot-amplifi-magnifi-client.mjs --entitle <slug>
node scripts/pilot-amplifi-magnifi-client.mjs --smoke <slug>
```

---

## Events Add-on

1. Run `node scripts/ensure-event-hub-airtable-schema.mjs`
2. Create pretix event + webhook (Basic Auth)
3. Staff-publish shop URL in portal Event Hub
4. Entitle `events` (included in Launch Edition)
5. Test order → check **Portal Event Registrations**

**Doc:** [integrations/PRETIX-EVENT-ENGINE.md](./integrations/PRETIX-EVENT-ENGINE.md)

---

## Real Estate pack

Keyword clients (brokerage, realty) → `real-estate` pack at fulfill time.

Nav: **Your Pipeline** · **Your Listings** · Documents · Contact · Help · **Intake**

```bash
node scripts/test-real-estate-pack-cert.mjs
```

Or set `Industry Pack Id` = `real-estate` on Organization in Mission Control.
