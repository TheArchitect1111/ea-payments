# 100% launch ready — checklist

**Current status:** `friend_testing_ready` (~85% overall)  
**Check:** https://ea-payments.vercel.app/api/health/launch

---

## How Simplifi, Magnifi, and Amplifi connect

```
Simplifi (capture)  →  Magnifi (auto-built story)  →  Amplifi (share link)
     /capture              opens automatically            share Consider URL
```

**One API call** runs the full pipeline. You do not run Magnifi separately — it is created when Simplifi finishes. Amplifi is the **share** step (Consider link / native share sheet).

---

## Browser icon & floating buttons

| Device | How |
|--------|-----|
| **Chrome toolbar** | Load `extension/` → gold **EA** icon → Capture or Amplify |
| **Chrome floating** | Same extension → **Capture** (blue) + **Amplify** (gold) bottom-right on any site |
| **Phone** | `/capture` or `/amplify` → Add to Home Screen |
| **Bookmarklet** | `/amplifi/install` → drag “Amplifi This Page” |

Install: https://ea-payments.vercel.app/amplifi/install  
Zip for sharing: run `scripts\package-extension.bat`

---

## Code complete (done)

- [x] Simplifi capture + scores + Airtable save
- [x] Magnifi auto-build on every capture
- [x] Auto-open Magnifi tab after capture
- [x] Amplifi share button after capture
- [x] Linked pipeline UI (Simplifi → Magnifi → Amplifi)
- [x] Chrome dual FAB (Capture + Amplify)
- [x] `/start` tester hub + health API
- [x] Client portal (demo)
- [x] Possibility-first marketing homepage (DISCOVER THE POSSIBILITIES)
- [x] Decision + Build Intelligence v0 on every capture (`docs/SIMPLIFI-INTELLIGENCE.md`)

---

## You must do for 100% (manual)

| # | Task | Why | Link |
|---|------|-----|------|
| 1 | **Vercel domain cleanup** | Remove `www` from `efficiency-architects` project; set primary on `ea-payments` | `docs/DNS-THREE-CLICKS.md` |
| 2 | **`NEXT_PUBLIC_BASE_URL`** | Canonical links | `https://www.efficiencyarchitects.online` |
| 3 | **`ONBOARDING_WEBHOOK_URL`** | Payment → Make automation | Vercel env + Make scenario |
| 4 | **`ESIGN_WEBHOOK_URL`** | Signed docs → Airtable | Vercel env + Make |
| 5 | **Resend domain verified** | Welcome emails send | https://resend.com/domains |
| 6 | **Stripe live mode test** | Real checkout works | `/checkout` test purchase |
| 7 | **Partner rows in Airtable** | Partner portal logins | Partner Network base |
| 8 | **Chrome Web Store** (optional) | One-click extension install | Google developer account |

---

## Not planned for v1

- Native App Store / Play Store app (use home screen + extension)
- Full OCR on image uploads (heuristic today)
- Calendly webhook for confirmed discovery bookings (click tracking only)
- Server-side PDF export for Magnifi (print today)

---

## After manual steps — verify

```powershell
node scripts/launch-readiness.mjs
```

Health should show `full_launch_ready` when webhooks + DNS are done.

Send testers: **https://ea-payments.vercel.app/start**
