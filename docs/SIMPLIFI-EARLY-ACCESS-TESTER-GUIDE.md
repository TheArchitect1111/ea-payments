# Simplifi Early Access — Tester Guide

**Version:** Early Access (Goal B)  
**Last updated:** 2026-07-16  
**Production base URL:** https://efficiencyarchitects.online  
**Also OK:** https://ea-payments.vercel.app  

---

## What you are testing

Simplifi captures opportunities, runs analysis, builds a Magnifi story (with Download PDF), opens guidance, and keeps history in the workspace. Guest captures can be claimed after sign-in. The companion extension uses a time-limited session token and server-backed watch lists.

---

## Quick start URLs

| Step | URL |
|------|-----|
| Start | https://efficiencyarchitects.online/start |
| Capture | https://efficiencyarchitects.online/simplifi/capture |
| Capture alias | https://efficiencyarchitects.online/capture |
| Workspace | https://efficiencyarchitects.online/simplifi/workspace |
| Portal login | https://efficiencyarchitects.online/portal/login |
| Extension connect | https://efficiencyarchitects.online/extension/connect |
| Demo login | `demo@efficiencyarchitects.online` / `DemoPulse2026!` |

**Note:** `https://app.simplifi.ai` is **not yet live** (DNS not configured). Use the URLs above until DNS is added in Vercel.

---

## Recommended test flow

1. **Sign in** — Portal or Simplifi login with demo credentials (or your provisioned account).
2. **Capture** — Open `/simplifi/capture`, paste a public business URL, submit.
3. **Wait** — Analysis may take up to 60 seconds; if processing times out, use **Open workspace**.
4. **Magnifi** — Open the Magnifi link — story should render (200).
5. **Download PDF** — On Magnifi or Classic report, click **Download PDF** → Print → Save as PDF.
6. **Guidance** — Open `/simplifi/guidance/{captureId}` — guided journey + guide panel.
7. **Workspace** — Open `/simplifi/workspace` — capture appears in your list (signed-in users).
8. **Optional extension** — Load unpacked `extension/`, visit `/extension/connect` while signed in, capture or watch a page.

---

## Known limitations (do not file as bugs)

### Capture

- Uploads over **~3.5 MB** are rejected with a clear error — compress or use URL capture.
- **HEIC** phone photos are rejected — switch camera to JPEG or convert first.
- **Guest capture** works for demos; sign in so history claims into your portal.
- Thin pages (e.g. `example.com`) show **Low confidence** and honest limited-signal copy — use a real business URL for richer Magnifi.

### Magnifi

- `/magnifi/{id}` returns **404** if the capture record was not saved to Airtable.
- **Download PDF** opens a printable HTML pack (browser Print → Save as PDF). There is no separate binary PDF microservice.
- Template quality varies — not all 10 template families are campaign-ready.

### Amplifi / sharing

- Amplifi depends on the Simplifi capture pipeline — not a separate analysis engine.
- Native share behavior varies by device and browser.

### Access & privacy

- **Consider**, **Magnifi**, and **Simplifi Guidance** links are **public-by-link** today.
- **Do not** capture or share sensitive, confidential, or PII-heavy content externally.
- Admin routes are internal only.

### Auth

- Two login paths exist: **Portal** (`/portal/login`) and **Simplifi** (`/simplifi/login`). Portal session is preferred for workspace history.
- Extension sessions expire (~7 days) and refresh automatically; reconnect at `/extension/connect` if capture stops working.
- **"Simplifi Early Access required"** — client not on Simplifi package; demo login auto-provisions on first sign-in.

### Platform (intentionally not in Early Access)

- **EA Assistant** is not shown on Simplifi paths — use **CompanionOrb** on workspace or **Guide panel** on guidance pages.
- **Experience Builder** is portal-only — not integrated into Simplifi capture flow.

### Infrastructure

- Capture persistence requires **Airtable Capture Records** — health check must show `products.simplifi: true`.
- Full public host still requires `app.simplifi.ai` DNS + Sentry DSN (operator checklist in `docs/SIMPLIFI-GOAL-B-OPERATOR.md`).

---

## What to report

Please report:

- Capture fails with no record id
- Magnifi or guidance 404 after successful capture
- Download PDF fails while signed in
- Login loops or "Not configured" errors
- Workspace empty after signed-in capture
- Extension connect succeeds but capture/watch fails after reconnect

Please **do not** report as P0:

- app.simplifi.ai not resolving (known — use efficiencyarchitects.online)
- Low confidence on thin/demo URLs
- Blue vs navy branding differences
- Missing EA Assistant on Simplifi

---

## Operator verification

```bash
node scripts/validate-simplifi-launch-readiness.mjs https://efficiencyarchitects.online
node scripts/test-capture-e2e.mjs https://efficiencyarchitects.online
node scripts/test-simplifi-goal-b-pass2.mjs
node scripts/test-simplifi-goal-b-pass3.mjs
node scripts/test-simplifi-goal-b-pass4.mjs
node scripts/setup-simplifi-watch-list-table.mjs
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-16 | Goal B: PDF print, thin-URL honesty, extension sessions, watch lists; canonical URLs |
| 2026-07-07 | Initial Early Access tester guide (Phase 1 launch readiness) |
