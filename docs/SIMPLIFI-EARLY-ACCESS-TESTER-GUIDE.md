# Simplifi Early Access — Tester Guide

**Version:** Early Access (Phase 1 launch readiness)  
**Last updated:** 2026-07-07  
**Production base URL:** https://ea-payments.vercel.app  
**Alternate workspace URL:** https://www.efficiencyarchitects.online/simplifi/workspace

---

## What you are testing

Simplifi captures opportunities, runs analysis, builds a Magnifi story, and opens a guidance page with next steps. This is **early access** — not the full EA Platform unified experience.

---

## Quick start URLs

| Step | URL |
|------|-----|
| Capture (phone-friendly) | https://ea-payments.vercel.app/simplifi/capture |
| Capture alias | https://ea-payments.vercel.app/capture |
| Workspace | https://ea-payments.vercel.app/simplifi/workspace |
| Portal login | https://ea-payments.vercel.app/portal/login |
| Simplifi login | https://ea-payments.vercel.app/simplifi/login |
| Demo login | `demo@efficiencyarchitects.online` / `DemoPulse2026!` |

**Note:** `https://app.simplifi.ai` is **not yet live** (DNS not configured). Use the URLs above until DNS is added in Vercel.

---

## Recommended test flow

1. **Sign in** — Portal login or Simplifi login with demo credentials (or your provisioned account).
2. **Capture** — Open `/simplifi/capture`, paste a public URL (e.g. a business homepage), submit.
3. **Wait** — Analysis may take up to 60 seconds on slow URLs.
4. **Follow links** — After success you should see links to **Magnifi** and **Simplifi Guidance**.
5. **Magnifi** — Open `/magnifi/{captureId}` — story/report should render (200).
6. **Guidance** — Open `/simplifi/guidance/{captureId}` — guided journey + guide panel.
7. **Workspace** — Open `/simplifi/workspace` — capture appears in your list (signed-in users).

---

## Known limitations (do not file as bugs)

### Capture

- **Large files** may fail — retry with a smaller image or use URL capture instead.
- **Guest capture** works for first-run demos; **signed-in portal use** is better for long-term history.
- **Async captures** may show "processing" before Magnifi/guidance links are ready — refresh after a few seconds.
- **URL-only test sites** (e.g. `example.com`) produce generic analysis — use a real business URL for meaningful Magnifi output.

### Magnifi

- `/magnifi/{id}` returns **404** if the capture record was not saved to Airtable.
- PDF export is not a first-class server feature yet.
- Template quality varies — not all 10 template families are campaign-ready.

### Amplifi / sharing

- Amplifi depends on the Simplifi capture pipeline — not a separate analysis engine.
- Native share behavior varies by device and browser.

### Access & privacy

- **Consider**, **Magnifi**, and **Simplifi Guidance** links are **public-by-link** today.
- **Do not** capture or share sensitive, confidential, or PII-heavy content externally.
- Admin routes are internal only.

### Auth

- Two login paths exist: **Portal** (`/portal/login`) and **Simplifi** (`/simplifi/login`). Both can work; portal session is preferred for full workspace history.
- **"Simplifi Early Access required"** — client not on Simplifi package; demo login auto-provisions on first sign-in.
- Mobile app uses **magic link** — see `mobile/README.md`.

### Platform (intentionally not in Early Access)

- **EA Assistant** is not shown on Simplifi paths — use **CompanionOrb** on workspace or **Guide panel** on guidance pages.
- **Experience Builder** is portal-only — not integrated into Simplifi capture flow.
- **Decision Intelligence** runs on new captures via API; workspace shows it as an expandable note, not a full Decision Workspace UI.

### Branding

- Simplifi standalone surfaces use **Simplifi blue** (`#0A66FF`) on marketing/capture PWA.
- EA Portal uses **navy/gold** EA Design System tokens.
- This is intentional for Early Access — not a defect.

### Infrastructure

- Capture persistence requires **Airtable Capture Records** — health check must show `products.simplifi: true`.
- Full public launch still requires Sentry DSN and uptime dashboard (not required for Early Access).

---

## What to report

Please report:

- Capture fails with no record id
- Magnifi or guidance 404 after successful capture
- Login loops or "Not configured" errors
- Workspace empty after signed-in capture
- Intelligence API errors on **new** captures (after 2026-07-07 intelligence ship)

Please **do not** report as P0:

- app.simplifi.ai not resolving (known — use ea-payments.vercel.app)
- Blue vs navy branding differences
- Missing EA Assistant on Simplifi
- Missing Experience Builder in capture flow

---

## Operator verification

```bash
node scripts/validate-simplifi-launch-readiness.mjs https://ea-payments.vercel.app
node scripts/test-capture-e2e.mjs https://ea-payments.vercel.app
curl https://ea-payments.vercel.app/api/health/launch | jq '.checks.products.simplifi'
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-07 | Initial Early Access tester guide (Phase 1 launch readiness) |
