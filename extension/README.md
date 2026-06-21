# Amplifi™ — Browser Companion

Chrome extension: **toolbar icon + floating Amplify button** on every page.

## Install (developer mode — for real-world testing today)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this `extension/` folder
4. Open extension **Settings** → set **API Base URL**: `https://ea-payments.vercel.app`

## What testers see

| Surface | What happens |
|---------|----------------|
| **Gold toolbar icon** | Click → Amplify This Page |
| **Floating button** | Bottom-right **Amplify** on any site (except EA platform pages) |
| **Right-click** | Amplifi™ this page |
| **Phone** | Open https://ea-payments.vercel.app/amplify → Add to Home Screen |

Amplify opens `/amplifi/share?url=…` → sign in → build Magnifi share link → native Share sheet on phone.

## Market links (send to friends)

- **Amplify:** https://ea-payments.vercel.app/amplify  
- **Capture (Simplifi):** https://ea-payments.vercel.app/capture  
- **Story demo (Magnifi):** https://ea-payments.vercel.app/story/selena  
- **Install guide:** https://ea-payments.vercel.app/amplifi/install  

Future custom domains: `amplify.efficiencyarchitects.online`, `capture.…`, `story.…` (add in Vercel Domains).
