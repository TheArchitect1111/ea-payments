# Website + Portal Golden Path

**Operator checklist:** buy → fulfill → `/sites` → portal Client Experience.

---

## 1. Buy

| Item | Detail |
|------|--------|
| Offer | `website_portal_starter` |
| Surface | `/buy` → Stripe checkout |
| Modules | `WEBSITE_PORTAL_MODULES` + `ensureLaunchEditionModules` (events, billing, settings) |

```bash
node scripts/test-website-portal-starter.mjs
node scripts/test-website-portal-golden-path-cert.mjs
```

---

## 2. Fulfill (automatic)

Stripe webhook → `fulfillPaidClient`:

1. Portal access + org ensure
2. Package entitlements
3. Connect provision (optional industry template)
4. Website publish via Experience Director gate
5. CTP workspace bind
6. Welcome magic link email

```bash
node scripts/test-fulfill-paid-client.mjs
```

---

## 3. Public site

| URL | Purpose |
|-----|---------|
| `/sites/{slug}` | Published starter website |
| `/portal/login` | Client portal entry |

Verify site live on checkout success page (**Open My Website** CTA).

---

## 4. Portal Client Experience

Five-nav chrome (ctp-client pack when `preferClientExperience`):

- Your Project · Documents · Contact · Help · Journey

**Hidden by design:** Pulse, Simplifi, Amplifi, Connect.

Real-estate keyword clients may get **real-estate** pack (Pipeline / Listings labels).

---

## Ops panel

Master CC → **Website + Portal Ops** → readiness + provision + schema setup.

---

## Factory note

Factory wire-selected concept publish is separate from this golden path. If Factory shows false entitlement noise for Website+Portal clients, confirm `Commerce Offer Id` = `website_portal_starter` on Client Record — do not enable Amplifi/Simplifi unless sold.
