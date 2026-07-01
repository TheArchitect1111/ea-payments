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
