# Simplifi Goal B — Operator checklist (100% Early Access)

Product code for Pass 2–4 is on `master`.  
**You can test on a phone today** on the working host below. Branded `simplifi.ai` DNS still needs a fix.

## Phone testing — do this now (works today)

### Option A — Browser + Add to Home Screen (recommended)

1. On your phone open:  
   **https://efficiencyarchitects.online/simplifi/workspace** (Today's Brief)
2. **Sign in (for history):**  
   - https://efficiencyarchitects.online/portal/login  
   - Tap **Sign in with password instead**  
   - Email: `demo@efficiencyarchitects.online`  
   - Password: `DemoPulse2026!`  
   - Then open `/simplifi/workspace`  
   **Or** use https://efficiencyarchitects.online/simplifi/login → enter the demo email → open the magic link from email **on the phone**.
3. From Brief, tap **Capture** → paste a business URL (or upload a JPEG — not HEIC).
4. **Install on phone:** Share → **Add to Home Screen**.  
   PWA `start_url` opens Today's Brief (standalone icon).

### Option B — Native app download

There is **no App Store / Play Store / TestFlight build published**.

| Want | Do this |
|------|---------|
| Try native UI quickly | Install **Expo Go** → on a computer `cd mobile`, set `EXPO_PUBLIC_API_BASE_URL=https://efficiencyarchitects.online`, `npm install`, `npm start`, scan QR |
| Real installable build | Follow `mobile/NATIVE-SHIP.md` and `mobile/README.md` (`eas build` / TestFlight) with EAS + Apple/Google accounts |

---

## Pass 1 — What you still need to finish (operator)

Open **Mission Control** (`/admin/master`) — incomplete items show as attention cards → `/launch`.

### 1. Fix `simplifi.ai` DNS (GoDaddy / Domaincontrol)

Vercel already has `simplifi.ai` + `app.simplifi.ai` on **ea-payments**, but public DNS still serves a **/lander** stub (not the app). Nameservers are Domaincontrol, not Vercel.

**In GoDaddy DNS for `simplifi.ai`:**

1. Open DNS management for `simplifi.ai`
2. Set apex **A** record → `76.76.21.21` (Vercel)
3. For `app` subdomain: **A** `app` → `76.76.21.21`  
   (or the exact record shown in Vercel → ea-payments → Settings → Domains)
4. Remove conflicting parking/lander records
5. Wait for SSL → confirm:
   - https://simplifi.ai/api/health/launch returns JSON `ok: true`
   - https://simplifi.ai/simplifi/capture shows the real capture UI (not redirect to `/lander`)

Until then, testers use **efficiencyarchitects.online** only.

### 2. Sentry DSN

1. Sentry → project `ea-payments` → Client Keys (DSN)
2. Vercel Production → `NEXT_PUBLIC_SENTRY_DSN` = DSN
3. Redeploy
4. Confirm `/api/health/launch` → `checks.controls.sentryDsn: true`  
   Details: `docs/sentry-setup.md`

### 3. Uptime

Set `UPTIME_KUMA_DASHBOARD_URL` or `UPTIME_MONITORING_URL` if missing.  
Monitors should include `/simplifi/capture`, `/simplifi/workspace`, `/api/health/launch`.

---

## Pass 2–4 — Shipped in code

```bash
node scripts/validate-simplifi-launch-readiness.mjs https://efficiencyarchitects.online
node scripts/test-simplifi-goal-b-pass2.mjs
node scripts/test-simplifi-goal-b-pass3.mjs
node scripts/test-simplifi-goal-b-pass4.mjs
```

## Definition of done

- [ ] `simplifi.ai` serves ea-payments (not `/lander`)
- [ ] Optional `app.simplifi.ai` resolves to workspace/capture
- [ ] Sentry DSN live
- [ ] Uptime env/monitors
- [x] Pass 2–4 product code
- [ ] Phone smoke: capture → Magnifi → PDF → guidance → workspace

## Demo credentials

`demo@efficiencyarchitects.online` / `DemoPulse2026!`  
(Password works on **portal** login; Simplifi login is magic-link only.)
