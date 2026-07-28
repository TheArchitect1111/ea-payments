# Simplifi Orb — Google Play asset package

Production-ready store listing assets for **Simplifi Orb** (`com.efficiencyarchitects.simplifiorb`).

Upload these files in Play Console → Grow → Store presence → Main store listing → Graphics.

## Brand system

| Token | Value | Use |
|-------|--------|-----|
| Navy | `#1B2B4D` | Primary dark / icon ground |
| Deep navy | `#0B1224` | Feature graphic depth |
| Gold | `#C9A844` | Orb glow, accents, CTAs |
| Cream | `#FAF8F3` | App screen backgrounds |
| White | `#FFFFFF` | Cards / primary text on dark |

Style: premium, modern, minimal, Apple-quality — glowing Orb mark + high-end productivity UI.

## Asset inventory

| File | Size | Purpose |
|------|------|---------|
| `app-icon-512.png` | 512×512 | High-res icon (Play Console) |
| `feature-graphic-1024x500.png` | 1024×500 | Feature graphic (required) |
| `screenshot-01.png` | 1080×2400 | Home dashboard |
| `screenshot-02.png` | 1080×2400 | Orb conversation |
| `screenshot-03.png` | 1080×2400 | Capture workflow |
| `screenshot-04.png` | 1080×2400 | AI prioritization |
| `screenshot-05.png` | 1080×2400 | Opportunity organization (Workspace) |
| `screenshot-06.png` | 1080×2400 | Daily Brief |
| `screenshot-07.png` | 1080×2400 | Reminders / Follow-ups |
| `screenshot-08.png` | 1080×2400 | Settings |
| `LISTING.md` | — | Short + full description (paste into Console) |
| `generate-assets.mjs` | — | Regenerator script |

## Screenshot notes

1. **Home dashboard** — Mirrors in-app Brief home (greeting, Today’s Brief, recent opportunities).
2. **Orb conversation** — High-fidelity dark Orb chat (AI assistant surface for store storytelling).
3. **Capture workflow** — Matches Capture: URL / prospect / notes → Analyze with Orb.
4. **AI prioritization** — Ranked next actions (urgency / warmth) driven by Orb.
5. **Opportunity organization** — Workspace-style opportunity cards.
6. **Daily Brief** — Focused morning plan distilled from captures.
7. **Reminders / Follow-ups** — Due today + upcoming nudges.
8. **Settings** — Account, push, legal links, sign out (matches production settings).

Screenshots use phone UI at **1080×2400** with **no device frames** (Play-preferred). Content reflects real Simplifi Orb flows; Orb chat / prioritization screens are high-fidelity product-accurate mockups where a dedicated native screen is still evolving.

## Google Play compliance checklist

- [x] App icon 512×512 PNG
- [x] Feature graphic exactly 1024×500 PNG
- [x] ≥2 phone screenshots (8 provided), JPEG or 24-bit PNG, min 320px short side
- [x] No excessive text on feature graphic
- [x] No device frames on feature graphic
- [x] Short description ≤80 characters
- [x] Full description with keywords (AI assistant, productivity, opportunities, Brief, follow-up)
- [x] Privacy / Terms / support URLs in `LISTING.md`
- [ ] Content rating (IARC) — complete in Console
- [ ] Data safety form — use `mobile/store-listing/data-safety.json`
- [ ] Ads declaration: **No**

## Regenerate

From the `ea-payments` repo root (requires Playwright Chromium):

```bash
npx --yes playwright install chromium
node docs/google-play/generate-assets.mjs
```

Also sync the 512 icon into the Expo app if desired:

```bash
copy docs\google-play\app-icon-512.png mobile\store-listing\icon-512.png
copy docs\google-play\app-icon-512.png mobile\assets\icon.png
```

## Related

- Expo wiring: `mobile/app.json`
- Prior listing notes: `mobile/store-listing/LISTING.md`
- Data safety: `mobile/store-listing/data-safety.json`
