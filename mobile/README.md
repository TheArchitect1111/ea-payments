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
| Capture | `POST /api/portal/captures/analyze` |
| Workspace | `GET /api/simplifi/workspace` |
| Settings | Sign out via `POST /api/auth/logout` |

## Deep link scheme

- Scheme: `simplifi://`
- Auth callback: `simplifi://auth/callback?token={sessionToken}`

Magic links requested from the app use `next=simplifi://auth/callback` so verify redirects back into the app when configured.

## Not yet in mobile

- Camera / OCR capture (Phase 5)
- Push notification registration UI (API exists: `POST /api/simplifi/push-token`)
- Offline capture queue (web PWA only today)
