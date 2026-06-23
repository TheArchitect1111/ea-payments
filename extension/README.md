# EA Simplifi + Amplifi — Chrome / Firefox extension

## Quick install (no manual API key)

1. `chrome://extensions` → **Developer mode** → **Load unpacked** → select this `extension/` folder.
2. On first install, a tab opens to **`/extension/connect`** on production.
3. Guest session starts automatically; the extension receives API config — done.

Manual fallback: open **Options** and paste API Base URL + key only if connect fails.

## Options (advanced)

- **API Base URL:** `https://www.efficiencyarchitects.online` (or preview URL)
- **Capture API Key:** auto-filled via `/extension/connect`, or `EA_CAPTURE_API_KEY` from Vercel (optional — derived from `ADMIN_SESSION_SECRET` if unset)
- **Portal slug:** optional tenant slug for captures
- **Notify email:** optional completion email

## Package for testers

```bat
scripts\package-extension.bat
```

Produces `dist\ea-amplifi-extension.zip`.

## Env on Vercel

- `EA_CAPTURE_API_KEY` — optional explicit key
- `ADMIN_SESSION_SECRET` — used to derive capture key when `EA_CAPTURE_API_KEY` is unset

## Chrome Web Store

Not required for launch. Use load-unpacked + `/extension/connect` for friend testing. Web Store listing is a post-launch polish step.
