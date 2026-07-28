# Simplifi Mobile (Expo)

Thin client for the Simplifi Intelligence OS. Uses the same JSON APIs as the web PWA — **one brain, many doors**.

## Prerequisites

- Node 20+
- [Expo Go](https://expo.dev/go) on your phone, or iOS Simulator / Android emulator

## Setup

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

Set `EXPO_PUBLIC_API_BASE_URL` to your preview or production host (default: `https://efficiencyarchitects.online`).

## Sign in

1. Enter your portal email → **Send magic link**
2. Open the email on your phone
3. If the link opens the app (`simplifi://auth/callback?token=…`), you are signed in automatically
4. Otherwise, copy the link and paste it under **Paste login link or token** → **Complete sign in**

Session tokens are stored in `expo-secure-store` and sent as `Authorization: Bearer`.

## Screens

| Tab | API |
|-----|-----|
| Home | `GET /api/simplifi/brief`, `/api/simplifi/me` |
| Capture | `POST /api/portal/captures/analyze` (URL JSON or photo multipart) |
| Workspace | `GET /api/simplifi/workspace` |
| Settings | Push registration + sign out |

Orb UI (corner intelligence) remains on the web PWA for now. These tabs feed the
same capture → Brief → Inbox records GlobalOrb reads on `/simplifi/*`.

## Push notifications

On sign-in, the app requests notification permission and registers an Expo push token via `POST /api/simplifi/push-token`. Re-enable from **Settings → Enable push notifications**. Requires a physical device (not Expo Go simulator).

## Photo capture

**Capture** tab supports camera and gallery uploads. Images are sent as `multipart/form-data` to the same analyze endpoint as the web PWA; vision/OCR runs server-side.

Processing captures poll `GET /api/capture/{id}/status` until triaged.

## Offline queue

When offline, URL and photo captures are saved locally (AsyncStorage + document directory for images). The app auto-syncs when connectivity returns — same behavior as the web PWA service worker queue.

## Voice notes

**Dictate notes** uses on-device speech recognition (`expo-speech-recognition`). Requires a **dev client build** — it does not work in Expo Go:

```bash
npx expo run:ios
# or
npx expo run:android
```

Transcripts append to the notes field and are sent with the next capture.

## Workspace actions

Tap an opportunity → **Actions** to record outcomes (won/lost/passed/in progress), snooze, set active-save purpose, or archive. Uses the same portal capture APIs as the web workspace.

## EAS builds (TestFlight / internal)

```bash
cd mobile
npm install -g eas-cli   # once
eas login
eas build:configure        # links project if needed
npm run build:dev:ios      # dev client with native modules (voice, push)
npm run build:preview      # internal distribution
```

Set `EXPO_PUBLIC_API_BASE_URL` to your preview or production host (default: canonical `https://efficiencyarchitects.online` via `app.config.ts`).

## Google Play (Android)

Full release runbook: **[GOOGLE-PLAY-RELEASE.md](./GOOGLE-PLAY-RELEASE.md)**.

**Package name (required):** `com.efficiencyarchitects.simplifiorb` — set in `app.json` → `expo.android.package`.

### Wrong signing key

Play Console upload certificate for package `com.efficiencyarchitects.simplifiorb`:

`SHA1: F7:5F:38:06:A3:CF:75:84:AA:92:35:B6:8E:80:A4:CD:4F:8C:00:1B`

That keystore lives in EAS under `@efficiency-architects/simplifi-mobile` (sourced from the earlier `@thearchitect1111/simplifi-mobile` credentials for the same package). Do **not** let `eas init` / credentials generate a new Android keystore — a fresh key (e.g. `AC:14:85:A8:…`) will fail Play upload.

**Fix if EAS drifts again:**

1. Confirm EAS default Android keystore SHA1 matches `F7:5F:38:06:…` (`eas credentials -p android`).
2. If not, **Upload existing** / re-assign the F7 keystore — never “Generate new”.
3. Rebuild:
   ```bash
   npm run build:production:android
   ```

Note: SHA1 `28:9D:26:30:…` belongs to a different application id (`online.efficiencyarchitects.simplifiorb`), not this Play listing.

If the F7 keystore is lost, use [Play Console → Setup → App signing → Request upload key reset](https://support.google.com/googleplay/android-developer/answer/9842756) (Google approval required).

Never commit keystore files or passwords to git.

## TestFlight

1. Create an Expo project: `eas init` (once)
2. Configure App Store Connect app + credentials: `eas credentials`
3. Build for TestFlight:

```bash
npm run build:testflight
npm run submit:testflight
```

The `testflight` profile uses `distribution: store` and pins the canonical API URL. For Vercel preview testing, override `EXPO_PUBLIC_API_BASE_URL` in `eas.json` or EAS secrets.

Required Apple env (set in EAS secrets or interactively on first submit):

- Apple ID email
- App Store Connect app ID (`ascAppId`)
- Apple Team ID
