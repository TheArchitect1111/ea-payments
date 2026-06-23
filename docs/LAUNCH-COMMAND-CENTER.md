# Launch Command Center

Single source of truth for ea-payments launch readiness (score 0–100).

## URLs

| Surface | URL |
|---------|-----|
| **Dashboard** | `/launch` |
| **JSON API** | `/api/health/command-center` |
| **Legacy health** | `/api/health/launch` |

## CLI

```bash
npm run launch:report          # Score + checklist (default: ea-payments.vercel.app)
LAUNCH_BASE_URL=https://www.efficiencyarchitects.online npm run launch:report
npm run launch:check           # Orchestrates report + smoke + tier2 + airtable
npm run repo:readiness         # Inventory EA repo reuse/readiness signals
npm run verify-airtable        # Local Airtable schema (needs .env.local)
npm run test:capture-e2e       # Capture pipeline E2E
npm run test:tier2             # Tier 2 env flags
```

## What is checked

| System | Automation | Checks |
|--------|------------|--------|
| **Airtable** | Fully / partial | API key, Capture/Pulse schema, Client onboarding fields, demo client |
| **Stripe** | Partial | API key validity, webhook secret env, live checkout (manual) |
| **Resend** | Partial | Env vars, domain verification via API |
| **Make** | Partial | ONBOARDING + ESIGN + CONTENT webhook env, HTTP probe to Make |
| **DNS** | Partial | `www.efficiencyarchitects.online` serves EA content, `NEXT_PUBLIC_BASE_URL` match |
| **Sentry** | Partial | `NEXT_PUBLIC_SENTRY_DSN` set |
| **Clerk** | N/A | Not used in ea-payments (HMAC portal auth) |
| **Product** | Full | Capture pipeline, Selena/Magnifi demo |

## Status values

Platform status values:

- **build_ready** - app is deployed, but revenue and delivery gates are incomplete
- **revenue_ready** - payment, records, and communication prerequisites are present
- **delivery_ready** - onboarding and delivery prerequisites are present
- **controlled_paid_launch_ready** - revenue and delivery are ready for friend testing, referral clients, and initial paid customers
- **full_launch_ready** - monitoring and resilience are also ready for public launch
- **scale_ready** - full launch plus mature operating controls

Checklist item status values:

- **Complete** — verified OK
- **Missing** — env var or resource not configured
- **Needs credentials** — invalid or missing API token
- **Needs human action** — Make UI, DNS registrar, eSignatures, live payment

## Score

Weighted sum of scored items (max 100). `controlled_paid_launch_ready` requires revenue readiness plus delivery readiness. `full_launch_ready` additionally requires monitoring and resilience controls.

## Related

- `docs/LAUNCH-READINESS-MODEL.md`
- `docs/MAKE-TIER2.md`
- `docs/MAKE-EA-ONBOARDING-SCENARIO.md`
- `docs/LAUNCH-100.md`
