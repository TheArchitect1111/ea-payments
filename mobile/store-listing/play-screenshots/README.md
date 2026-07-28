# Real Play screenshots (native app only)

Google Play Internal Testing requires **authentic screenshots from the installed Simplifi Orb Android build**.

Do **not** upload files from `marketing/play-store/` (lifestyle / campaign art).

## Required set (phone)

Capture on a physical Android device or emulator after installing the **production** or **preview** AAB/APK.

| File | Screen | Notes |
|------|--------|--------|
| `01-brief-home.png` | Brief / Home | Today's Brief with real content |
| `02-capture.png` | Capture | URL/photo capture UI |
| `03-workspace.png` | Workspace / Inbox | Opportunity list |
| `04-settings.png` | Settings | Shows Delete account + legal links |

Optional: processing state on Capture, expanded workspace card.

## Dimensions (Google Play phone)

- Preferred: **1080 × 1920** or **1080 × 2340** (portrait)
- Min: 320px on shortest side
- Max: 3840px on longest side
- Format: PNG or JPEG
- Aspect ratio between 16:9 and 9:16

## Capture steps

1. `cd mobile && npm run build:production:android` (or install Internal Testing build)
2. Fresh install → Legal accept → magic-link login
3. Capture at least one opportunity so Brief/Workspace are not empty
4. Use Android **Screenshot** (Power + Volume Down) or Android Studio emulator camera
5. Save files into this folder with the names above
6. Verify pixel size before Console upload

## Operator checklist

- [ ] Screenshots are from native app (not web, not marketing)
- [ ] No debug banners / Expo Go watermark
- [ ] Personal/demo PII acceptable for public store listing
- [ ] Copied into Play Console → Store listing → Phone screenshots (min 2)
