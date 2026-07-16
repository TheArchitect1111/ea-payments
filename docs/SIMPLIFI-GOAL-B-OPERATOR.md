# Simplifi Goal B — Operator checklist (100% Early Access)

Code for Pass 2 (upload limits, processing UX, guest claim) ships in the app.  
These items still need **operator / Vercel** action.

## Pass 1 — Infrastructure

### 1. `app.simplifi.ai` DNS

1. Vercel project → **Domains** → add `app.simplifi.ai`
2. DNS provider → CNAME `app` → `cname.vercel-dns.com`
3. Wait for SSL
4. Confirm:
   - `https://app.simplifi.ai` → Simplifi workspace/capture
   - `/capture` and `/app` aliases work on that host

Until then, testers use:

- https://efficiencyarchitects.online/simplifi/capture
- https://efficiencyarchitects.online/simplifi/workspace

### 2. Sentry DSN

1. Create/open Sentry project for `ea-payments`
2. Copy client DSN
3. Vercel Production → `NEXT_PUBLIC_SENTRY_DSN` = DSN
4. Redeploy
5. Confirm `/api/health/launch` → `checks.controls.sentryDsn: true`

### 3. Uptime (already configured if health shows uptime=true)

Confirm monitors include:

- `/simplifi/capture`
- `/simplifi/workspace`
- `/api/health/launch`

## Pass 2 — Shipped in code (verify)

| Capability | How to verify |
|------------|---------------|
| Upload size limit (3.5 MB) client + server | Oversized PDF → clear error / 413 |
| HEIC rejected with camera tip | Upload HEIC → friendly message |
| Processing timeout → workspace link | Slow capture → “Open workspace” |
| Resume processing after refresh | Start capture, refresh page → banner resumes |
| Guest → sign-in claim | Capture as guest, sign in → captures move to your slug |

## Pass 3 — Magnifi deliverable + honest URL analysis (shipped in code)

| Capability | How to verify |
|------------|---------------|
| Magnifi **Download PDF** | Open Magnifi or Classic → Download PDF → browser print / Save as PDF |
| Print route auth | `/api/portal/captures/{id}/print` requires Simplifi session + matching portal |
| Thin URL honesty | Capture a thin page (e.g. bare example.com) → Low confidence note, no invented revenue $ |
| Website audit merge | Thin HTTP URL → analysis includes audit findings / clearer gaps |

Contract: `node scripts/test-simplifi-goal-b-pass3.mjs`

## Tester handoff

1. Guide: `docs/SIMPLIFI-EARLY-ACCESS-TESTER-GUIDE.md`
2. Entry: `/start`
3. Demo: `demo@efficiencyarchitects.online` / `DemoPulse2026!`

## Definition of done (Goal B Early Access)

- [ ] Pass 1 DNS live
- [ ] Pass 1 Sentry live
- [x] Pass 2 reliability in production
- [x] Pass 3 Magnifi print + thin-URL honesty in code
- [ ] One full smoke: URL capture → Magnifi → PDF → guidance → workspace

## Still out of Early Access “100%” (Pass 4 / later)

- Extension scoped session token + server watch lists
- True binary PDF generation (Puppeteer) — not required; print-pack is the platform pattern
