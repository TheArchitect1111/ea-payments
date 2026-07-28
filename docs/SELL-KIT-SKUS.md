# Sell Kit — SKUs

One-page summaries for launch-ready offers.

---

## Website + Portal Starter

| | |
|---|---|
| **SKU** | `website_portal_starter` |
| **Buyer** | SMB needing public site + client portal fast |
| **Includes** | Auto-provisioned `/sites/{slug}`, portal login, CTP workspace bind, Launch Edition modules + Portal Ops (intake, applications, reports) |
| **CX** | `website-portal` pack: CTP five-nav + **Intake** (no Amplifi/Simplifi in chrome) |
| **Fulfillment** | Stripe → `fulfillPaidClient` → `website-portal` IndustryPack when not real-estate |
| **Cert** | `node scripts/test-website-portal-golden-path-cert.mjs` + `node scripts/test-portal-intake-cert.mjs` |
| **Runbook** | [WEBSITE-PORTAL-GOLDEN-PATH.md](./WEBSITE-PORTAL-GOLDEN-PATH.md) |

---

## CTP Implementation

| | |
|---|---|
| **SKU** | Implementation Package / CTP commercial close |
| **Buyer** | Consider the Possibilities™ engagement |
| **Intake** | https://cc.efficiencyarchitects.online/ctp |
| **Close** | `/admin/ctp` → proposal → Stripe pay → reveal |
| **Includes** | Portal, studio workspace, optional site, Connect, eSign/onboarding hooks |
| **Cert** | `docs/audits/CTP-MONEY-LOOP-CERT-CHECKLIST.json` |
| **Runbook** | [CTP-SELLABLE-CLOSE-RUNBOOK.md](./CTP-SELLABLE-CLOSE-RUNBOOK.md) |

---

## Simplifi Growth

| | |
|---|---|
| **SKU** | Simplifi subscription / early access |
| **Buyer** | Content-led growth clients |
| **Includes** | Simplifi capture + Magnifi stories + Amplifi draft hub |
| **Portal** | Executive chrome with Simplifi + Amplifi entitled |
| **Cert** | `docs/audits/AMPLIFI-MAGNIFI-CLIENT-USE-GO.json` |
| **Cheat sheet** | [AMPLIFI-MAGNIFI-CLIENT-CHEAT-SHEET.md](./AMPLIFI-MAGNIFI-CLIENT-CHEAT-SHEET.md) |

---

## Events Add-on (Event Hub)

| | |
|---|---|
| **SKU** | Launch Edition `events` module + pretix integration |
| **Buyer** | Camps, tournaments, workshops needing registration + payments |
| **Engine** | pretix Hosted (SoT for tickets/payments) |
| **EA** | Portal Event Hub tabs + Airtable registration ledger + reminders |
| **Durability** | `Portal Pretix Events` + `Portal Event Registrations` Airtable tables |
| **Cert** | `docs/audits/EVENT-HUB-CLIENT-USE-GO.json` |
| **Ops** | [PRETIX-EVENT-ENGINE.md](./integrations/PRETIX-EVENT-ENGINE.md) |

---

## Real Estate Website + Portal

| | |
|---|---|
| **Pack** | `real-estate` IndustryPack |
| **Trigger** | Org name/industry keywords (realtor, brokerage, realty) or explicit `Industry Pack Id` |
| **CX** | Pipeline / Listings / Documents / Contact / Help / **Intake** |
| **Cert** | `node scripts/test-real-estate-pack-cert.mjs` |

---

## Portal Ops (Intake · Applications · Scheduling · Reports)

1. Bootstrap form ledger: `node scripts/ensure-portal-forms-airtable-schema.mjs`
2. Entitle `intake`, `applications`, `reports` (included in Launch Edition presets)
3. Website + Portal CX shows **Intake** when `website-portal` pack is active
4. Staff set booking URL in Event Hub → Calendar (`Booking Url` on Organization)
5. Public apply: `/portal/{slug}/apply`

**Certs:** `test-portal-intake-cert.mjs`, `test-portal-applications-cert.mjs`, `test-portal-scheduling-cert.mjs`, `test-portal-reports-cert.mjs`

**Overview:** [PORTAL-OPS-MODULES.md](./PORTAL-OPS-MODULES.md)
