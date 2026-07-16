# Simplifi Early Access — Tester Guide

**Version:** Early Access (Goal B)  
**Last updated:** 2026-07-16  
**Production base URL:** https://efficiencyarchitects.online  
**Also OK:** https://ea-payments.vercel.app  

---

## What you are testing

Simplifi captures opportunities, runs analysis, builds a Magnifi story (with Download PDF), opens guidance, and keeps history in the workspace.

---

## Phone in 2 minutes

1. Open **https://efficiencyarchitects.online/simplifi/capture**
2. Sign in: https://efficiencyarchitects.online/portal/login → **Sign in with password instead** →  
   `demo@efficiencyarchitects.online` / `DemoPulse2026!`
3. Capture a business URL
4. Share → **Add to Home Screen** to install the capture PWA

**Do not use `simplifi.ai` yet** — DNS still points at a lander stub until Pass 1 DNS is fixed.

---

## Quick start URLs

| Step | URL |
|------|-----|
| Capture | https://efficiencyarchitects.online/simplifi/capture |
| Capture alias | https://efficiencyarchitects.online/capture |
| Workspace | https://efficiencyarchitects.online/simplifi/workspace |
| Portal login | https://efficiencyarchitects.online/portal/login |
| Simplifi magic-link login | https://efficiencyarchitects.online/simplifi/login |
| Start | https://efficiencyarchitects.online/start |
| Demo | `demo@efficiencyarchitects.online` / `DemoPulse2026!` |

---

## Recommended test flow

1. Sign in (portal password or Simplifi magic link)
2. Capture a real business URL
3. Open Magnifi → Download PDF
4. Open guidance → workspace

---

## Known limitations

- HEIC rejected — use JPEG / screenshot  
- Uploads over ~3.5 MB rejected  
- Thin URLs show Low confidence  
- Portal login has password; Simplifi login is magic-link only  
- Native app: Expo Go or EAS build only (`mobile/`) — no App Store link yet  
- `simplifi.ai` / `app.simplifi.ai` branded DNS incomplete  

---

## Operator verification

```bash
node scripts/validate-simplifi-launch-readiness.mjs https://efficiencyarchitects.online
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-16 | Phone Add-to-Home-Screen path; note simplifi.ai lander gap |
| 2026-07-16 | Goal B PDF / thin-URL / extension sessions |
| 2026-07-07 | Initial guide |
