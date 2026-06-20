# DNS cutover plan — `www.efficiencyarchitects.online`

Goal: one canonical marketing homepage (premium landing on `ea-payments`) at **`https://www.efficiencyarchitects.online`**, with funnel routes staying on the same origin.

## Current state

| URL | Serves today |
|-----|----------------|
| `https://ea-payments.vercel.app/` | Premium homepage (Unifi™, Fortifi™, Amplifi™, Pulse™, assessment CTA) |
| `https://www.efficiencyarchitects.online/` | Legacy Create React App (`efficiency-architects` repo) |
| `https://ea-payments.vercel.app/assessment` | Operational MRI (canonical funnel) |

## Recommended approach (Option A — single Vercel project)

Point **`www.efficiencyarchitects.online`** and **`efficiencyarchitects.online`** to the **`ea-payments`** Vercel project.

### Why

- Premium homepage already lives in `ea-payments`.
- Assessment, portal, scorecard, checkout, and admin stay on one domain — no cross-origin CTA links.
- Simplest ops: one deploy, one env var set, one Sentry project.

### Steps

1. **Pre-cutover checklist**
   - [ ] Production env vars set on `ea-payments` (Airtable, Resend, sessions, admin, Stripe if live).
   - [ ] `NEXT_PUBLIC_BASE_URL=https://www.efficiencyarchitects.online` in Vercel Production.
   - [ ] `UNSUBSCRIBE_URL=https://www.efficiencyarchitects.online/unsubscribe`.
   - [ ] Resend domain verified for `noreply@efficiencyarchitects.online`.
   - [ ] Smoke tests green on `master`.
   - [ ] Logo + scorecard committed under `public/` (survives redeploy).

2. **Vercel domain setup**
   - Vercel → `ea-payments` → Settings → Domains.
   - Add `www.efficiencyarchitects.online` and `efficiencyarchitects.online`.
   - Apply Vercel’s DNS records at your registrar (or move DNS to Vercel).

3. **Redirect apex → www**
   - Ensure `efficiencyarchitects.online` → `https://www.efficiencyarchitects.online` (301).

4. **Post-cutover verification**
   - [ ] `https://www.efficiencyarchitects.online/` body contains `What would become possible`.
   - [ ] `/assessment`, `/portal/login`, `/scorecard`, `/unsubscribe` return 200.
   - [ ] Submit test assessment → Airtable row + email received.
   - [ ] Enable “EA Marketing (canonical)” monitor in Uptime Kuma (`ea-operating-system/docs/uptime-kuma-monitors.md`).

5. **Decommission legacy**
   - After 48h stable traffic on new domain, remove or redirect old `efficiency-architects` Vercel production domain bindings.
   - Update LinkedIn, email signatures, and proposal templates to `www.efficiencyarchitects.online`.

## Alternative (Option B — keep two repos)

Deploy premium homepage to `efficiency-architects` repo and point `.online` there; CTAs link out to `ea-payments.vercel.app/assessment`.

**Downside:** split brand experience, harder canonical URLs, more drift risk. Not recommended unless DNS must stay on the legacy project.

## Rollback

1. Revert DNS at registrar to previous targets (legacy React app).
2. Set `NEXT_PUBLIC_BASE_URL=https://ea-payments.vercel.app` until DNS is fixed.
3. `vercel rollback ea-payments --yes` if a bad deploy shipped with the cutover.

## Timeline suggestion

| Day | Action |
|-----|--------|
| D-2 | Final env + smoke + stakeholder review on `ea-payments.vercel.app` |
| D-1 | Lower DNS TTL to 300s |
| D0 | Add domains in Vercel, update DNS, verify checklist |
| D+1 | Enable marketing uptime monitor, announce new URL |

## References

- `ea-operating-system/PRODUCTION.md` — canonical URL map
- `docs/branch-protection-checklist.md` — required CI before merge
- `docs/sentry-setup.md` — error monitoring after cutover
