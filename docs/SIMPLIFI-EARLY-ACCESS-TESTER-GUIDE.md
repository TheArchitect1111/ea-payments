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

1. Open **https://efficiencyarchitects.online/simplifi/workspace** (Today's Brief — home)
2. Sign in — easiest is the **one-click demo** straight to the Brief:  
   **https://efficiencyarchitects.online/api/auth/demo-enter?next=/simplifi/workspace**  
   (or `simplifi/login` magic link, or portal login → `demo@efficiencyarchitects.online` / `DemoPulse2026!`)
3. From Brief, tap **Capture** (or Ask Orb) to save a URL
4. Share → **Add to Home Screen** — PWA opens Today's Brief

**Do not use `simplifi.ai` yet** — DNS still points at a lander stub until Pass 1 DNS is fixed.

---

## Quick start URLs

| Step | URL |
|------|-----|
| Today's Brief (home) | https://efficiencyarchitects.online/simplifi/workspace |
| One-click demo → Brief | https://efficiencyarchitects.online/api/auth/demo-enter?next=/simplifi/workspace |
| Quick Capture | https://efficiencyarchitects.online/simplifi/capture |
| Inbox | https://efficiencyarchitects.online/simplifi/inbox |
| Capture alias | https://efficiencyarchitects.online/capture |
| Portal login | https://efficiencyarchitects.online/portal/login |
| Simplifi magic-link login | https://efficiencyarchitects.online/simplifi/login |
| Start | https://efficiencyarchitects.online/start |
| Demo | `demo@efficiencyarchitects.online` / `DemoPulse2026!` |

---

## Recommended test flow

1. Sign in — one-click demo (`/api/auth/demo-enter?next=/simplifi/workspace`), Simplifi magic link, or portal password
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
