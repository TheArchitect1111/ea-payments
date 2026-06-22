# Amplifi™ + Simplifi™ — Browser Companion (v3)

Chrome extension: **screenshot capture + background analysis + Chrome notifications**.

## Install (developer mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this `extension/` folder
4. Open extension **Settings** and set:
   - **API Base URL:** `https://ea-payments.vercel.app` (or `https://www.efficiencyarchitects.online`)
   - **Capture API Key:** `EA_CAPTURE_API_KEY` from Vercel env
   - **Notify email (optional):** your portal login email
   - **Portal slug (optional):** e.g. `demo-client`

## What testers see

| Surface | What happens |
|---------|----------------|
| **Floating Capture / Amplify buttons** | Screenshots the visible tab → queues background analysis → toast: keep browsing |
| **Toolbar popup** | Same — no new tab required |
| **Right-click menu** | Simplifi or Amplifi screenshot capture |
| **Chrome notification** | “Your story is ready” — tap to open Magnifi |
| **Email** | Resend “Capture Complete” when notify email is set |
| **Phone PWA** | `/amplify` or `/capture` — background analyze + browser notification + email |

## Server requirements (Vercel)

Set on **ea-payments** project:

- `EA_CAPTURE_API_KEY` — extension auth (generate a random secret)
- `AIRTABLE_API_KEY` — capture persistence
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — ready notifications
- `ANTHROPIC_API_KEY` (optional) — vision extraction from screenshots

## Market links

- **Amplify:** https://ea-payments.vercel.app/amplify  
- **Capture (Simplifi):** https://ea-payments.vercel.app/capture  
- **Story demo (Magnifi):** https://ea-payments.vercel.app/story/selena  
- **Install guide:** https://ea-payments.vercel.app/amplifi/install  