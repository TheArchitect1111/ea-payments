# Simplifi Goal B — Operator checklist (100% Early Access)

Product code for Pass 2–4 is on `master`.  
**You can test on a phone today** on the working host below. Branded entry is `/simplifiorb` on the EA domain.

## Phone testing — do this now (works today)

### Option A — Browser + Add to Home Screen (recommended)

1. On your phone open:  
   **https://efficiencyarchitects.online/simplifiorb** (Simplifi Orb → Today's Brief)
2. **Sign in (for history):**  
   - One-click: https://efficiencyarchitects.online/api/auth/demo-enter?next=/simplifi/workspace  
   - Or https://efficiencyarchitects.online/portal/login → **Sign in with password instead**  
     Email: `demo@efficiencyarchitects.online` / Password: `DemoPulse2026!`  
   - Or https://efficiencyarchitects.online/simplifi/login → magic link on the phone
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

### 1. Branded Simplifi entry — `app.efficiencyarchitects.online/simplifiorb`

`simplifi.ai` is **not** EA-owned. Use the EA domain instead.

**Vercel:** Domains → `ea-payments` → add `app.efficiencyarchitects.online`

**Namecheap** (for `efficiencyarchitects.online` → Advanced DNS):

1. Add **CNAME** host `app` → `cname.vercel-dns.com`
2. Wait for SSL
3. Confirm:
   - https://app.efficiencyarchitects.online/simplifiorb opens Today's Brief
   - https://app.efficiencyarchitects.online/api/health/launch returns JSON `ok: true`

**Works today without that DNS step:**  
https://efficiencyarchitects.online/simplifiorb

### 2. GlitchTip DSN (error monitoring)

1. GlitchTip → project for `ea-payments` → copy DSN  
2. Vercel Production → `NEXT_PUBLIC_GLITCHTIP_DSN` = DSN  
3. Redeploy  
4. Confirm `/api/health/launch` → `checks.controls.sentryDsn` / `glitchtipDsn: true`  
   Details: `docs/GLITCHTIP-SETUP.md`

### 3. Uptime

Set `UPTIME_KUMA_DASHBOARD_URL` or `UPTIME_MONITORING_URL` if missing.  
Monitors should include `/simplifiorb`, `/simplifi/capture`, `/simplifi/workspace`, `/api/health/launch`.

---

## Pass 2–4 — Shipped in code

```bash
node scripts/validate-simplifi-launch-readiness.mjs https://efficiencyarchitects.online
node scripts/test-simplifi-goal-b-pass2.mjs
node scripts/test-simplifi-goal-b-pass3.mjs
node scripts/test-simplifi-goal-b-pass4.mjs
```

## Definition of done

- [ ] `app.efficiencyarchitects.online/simplifiorb` serves Simplifi Brief (or apex `/simplifiorb` accepted until CNAME is live)
- [x] GlitchTip DSN live (`NEXT_PUBLIC_GLITCHTIP_DSN`)
- [ ] Uptime env/monitors
- [x] Pass 2–4 product code
- [ ] Phone smoke: Orb entry → capture → Magnifi → PDF → guidance → workspace

## Demo credentials

`demo@efficiencyarchitects.online` / `DemoPulse2026!`  
(Password works on **portal** login; Simplifi login is magic-link only.)
