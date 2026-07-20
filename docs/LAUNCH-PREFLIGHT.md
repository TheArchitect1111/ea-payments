# Launch Preflight (S0)

**Goal:** Invite with proof, not hope.

## Canonical CTP intake (only)

| Purpose | URL |
|---------|-----|
| **Consider the Possibilities™** | **https://cc.efficiencyarchitects.online/ctp** |

Do **not** send prospects to `/ctp-intake`, `/discover`, or `/consider/selena` as CTP intake.

Paid starter checkout (separate from CTP): https://efficiencyarchitects.online/buy

## Run

```bash
npm run launch:preflight
```

Optional base override:

```bash
# PowerShell
$env:LAUNCH_PREFLIGHT_BASE='https://efficiencyarchitects.online'; npm run launch:preflight
```

Writes `.launch-preflight.json` with step results + live API smokes.

## Pass criteria

| Check | Pass when |
|-------|-----------|
| `launch-report` / `launch-readiness` | Scripts exit 0 |
| `ctp-spine` | Soft for now (email/overview copy drift); reported but does not fail gate |
| `website-portal-starter` | Starter offer + webhook provisioner wired |
| `fulfill-paid-client` | Proposal pay and `/buy` share `fulfillPaidClient` |
| `oib-email` | Opportunity Intelligence Brief email contract passes |
| `canonical-ctp` | Public copy pins cc `/ctp` only |
| Live `GET /buy` | 2xx/3xx |
| Live `POST /api/assessment/submit` (CTP flags) | `ok` (Airtable save preferred) |
| Live `/api/health/launch` | Healthy / `websitePortalAuto` true when expected |

## Same-day manual confirmation

1. Open [canonical CTP](https://cc.efficiencyarchitects.online/ctp) and complete one real submission (your email).
2. Confirm welcome/executive email + `/portal/{slug}/ctp` (or login).
3. Open `/buy` → Website + Portal Starter checkout (test mode OK) and confirm portal + site provision after pay.

## Latest automated run (2026-07-20)

- `npm run launch:preflight` → **PREFLIGHT PASS**
- Live: CTP `POST /api/assessment/submit` 200 · `/buy` 200 · `/api/health/launch` ok
- Soft FAIL: `ctp-spine` (3 email/overview copy contracts; not money-loop blockers)
- Artifact: `.launch-preflight.json` (gitignored)

## Paid fulfillment parity (S1 start)

After Stripe payment (fixed package **or** proposal):

1. Client Record  
2. `createPortalAccess`  
3. `ensurePackageEntitlements`  
4. Connect provision  
5. Optional website (`provisionWebsite`) + magic link  

Shared helper: `lib/fulfill-paid-client.ts` — called from `app/api/webhooks/stripe/route.ts` for both `/buy` starter and proposal payment.
