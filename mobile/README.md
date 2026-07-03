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

Set `EXPO_PUBLIC_API_BASE_URL` to your preview or production host (default: `https://ea-payments.vercel.app`).

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

Set `EXPO_PUBLIC_API_BASE_URL` to your preview or production host (default: canonical `https://ea-payments.vercel.app` via `app.config.ts`).

## Google Play (Android)

**Package name (required):** `com.efficiencyarchitects.simplifiorb` — set in `app.json` → `expo.android.package`.

### Wrong signing key

Play Console expects your **upload certificate** fingerprint:

`SHA1: 28:9D:26:30:12:2A:18:29:29:4A:6A:F0:FF:50:61:1A:05:B1:53:35`

If your AAB shows a different SHA1 (e.g. `F7:5F:38:06:…`), it was signed with the wrong keystore — often a fresh EAS-generated key or a debug build.

**Fix:**

1. Locate the **original** upload keystore (`.jks` / `.keystore`) used for the first Play upload of this app.
2. Verify it matches Play’s expected cert:
   ```bash
   keytool -list -v -keystore your-upload-key.jks -alias your-alias
   ```
3. Register that keystore with EAS (from `mobile/`):
   ```bash
   eas credentials -p android
   ```
   Choose **production** → **Keystore** → **Upload existing keystore** (not “Generate new”).
4. Rebuild and submit:
   ```bash
   npm run build:production:android
   npm run submit:production:android
   ```

If the original keystore is lost, use [Play Console → Setup → App signing → Request upload key reset](https://support.google.com/googleplay/android-developer/answer/9842756) (Google approval required).

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
