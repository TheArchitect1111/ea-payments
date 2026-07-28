# Google Play asset checklist — Simplifi Orb

| Asset | Required for Internal Testing? | Status | Location / notes |
|-------|--------------------------------|--------|------------------|
| App name | Yes (listing) | Done | Simplifi Orb |
| Application ID / package | Yes | Done | `com.efficiencyarchitects.simplifiorb` |
| Version name | Yes | Done | `0.1.0` (`app.json`) |
| Version code | Yes | Done | `1` + EAS `autoIncrement` on production |
| App icon (Expo) | Yes (build) | Done | `mobile/assets/icon.png` |
| Adaptive icon | Yes (build) | Done | `mobile/assets/adaptive-icon.png` |
| 512×512 icon | Yes (listing) | Done (source) | `store-listing/icon-512.png` — verify pixel size in Console |
| Feature graphic 1024×500 | Yes (listing) | Partial | `store-listing/feature-graphic.png` — **resize to exact 1024×500 if needed** |
| Phone screenshots (2+) | Yes (listing) | **OPERATOR** | Capture native app into `store-listing/play-screenshots/` — do not use marketing art |
| Tablet screenshots | Optional | **MISSING** | Skip unless targeting tablets |
| Short description | Yes | Done | `LISTING.md` |
| Full description | Yes | Done | `LISTING.md` |
| Promotional text | Optional | Done | `LISTING.md` |
| Support email | Yes | Done | freedom@efficiencyarchitects.online |
| Support website | Yes | Done | https://efficiencyarchitects.online |
| Privacy Policy URL | Yes | Done | `/legal/privacy` |
| Account deletion URL | Yes (Play) | Done | `/legal/account-deletion` |
| Terms URL | Recommended | Done | `/legal/terms` |
| AI Disclosure URL | Recommended | Done | `/legal/ai-disclosure` |
| Data Safety | Yes before production; recommended early | Done (object) | `data-safety.json` → paste into Console |
| Content rating | Yes before production | **Console only** | Complete IARC questionnaire |
| Target audience | Yes before production | **Console only** | Not Families Policy |
| Category | Yes | Done (suggested) | Business / Productivity |
| Ads declaration | Yes | Done (No ads) | No AdMob in mobile |
| Service account JSON | For `eas submit` | **Operator local** | `google-play-service-account.json` (gitignored) |
| EAS projectId | For `eas build` | **Operator** | Set `EXPO_PUBLIC_EAS_PROJECT_ID` after `eas init` |
| Upload keystore | For signed AAB | **EAS credentials** | Must match Play SHA1 in README |
