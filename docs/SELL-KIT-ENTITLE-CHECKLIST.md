# Sell Kit — Entitlement Checklist

Mission Control steps + pilot scripts for launch-ready SKUs.

---

## General

1. Open Mission Control → **Capability Marketplace** → **Entitlements**
2. Select client organization (by portal slug)
3. Enable modules matching purchased SKU (see [SELL-KIT-SKUS.md](./SELL-KIT-SKUS.md))
4. Ask client to hard-refresh `/portal/{slug}`

---

## Website + Portal Starter

| Module | Enable? |
|--------|---------|
| dashboard, landing, ctp, documents, messaging, events, billing, settings, intake, applications, reports | Yes (via offer / Launch Edition) |
| simplifi, amplifi | **No** (unless upsold) |
| pulse, connect | Hidden in CX chrome |

**Verify:** `node scripts/test-website-portal-golden-path-cert.mjs`

---

## CTP Implementation

| Module | Enable? |
|--------|---------|
| ctp, documents, messaging, ask, resources | Yes |
| connect | After checkout hook |
| simplifi, amplifi | Only if Implementation package includes growth |

**Verify:** `docs/audits/CTP-MONEY-LOOP-CERT-CHECKLIST.json`

---

## Simplifi Growth (Amplifi + Magnifi)

```bash
node scripts/pilot-amplifi-magnifi-client.mjs --list
node scripts/pilot-amplifi-magnifi-client.mjs --entitle <portal-slug>
node scripts/pilot-amplifi-magnifi-client.mjs --smoke <portal-slug>
```

Enable: **`simplifi`** + **`amplifi`**

**GO checklist:** `docs/audits/AMPLIFI-MAGNIFI-CLIENT-USE-GO.json`

---

## Events Add-on

1. Ensure org has **`events`** module (Launch Edition default)
2. Bootstrap Airtable: `node scripts/ensure-event-hub-airtable-schema.mjs`
3. Configure pretix webhook + staff-publish event
4. Confirm registration row after test order

**GO checklist:** `docs/audits/EVENT-HUB-CLIENT-USE-GO.json`

---

## Real Estate pack

Set **Industry Pack Id** = `real-estate` on Organization — or rely on keyword inference at fulfill (`realtor`, `brokerage`, `realty`).

**Verify:** `node scripts/test-real-estate-pack-cert.mjs`

---

## Portal Ops modules

| Module | Enable? |
|--------|---------|
| intake, applications, reports | Yes (Launch Edition / Website + Portal) |
| events + org Booking Url | Scheduling embed on Calendar tab |

**Verify:**

```bash
node scripts/test-portal-intake-cert.mjs
node scripts/test-portal-applications-cert.mjs
node scripts/test-portal-scheduling-cert.mjs
node scripts/test-portal-reports-cert.mjs
```

**Overview:** [PORTAL-OPS-MODULES.md](./PORTAL-OPS-MODULES.md)

---

## Preflight (all SKUs)

```bash
npm run launch:preflight
```
