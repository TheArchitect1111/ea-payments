# Simplifi Orb — Google Play release guide

**Goal:** Internal Testing track on Google Play.  
**Package:** `com.efficiencyarchitects.simplifiorb`  
**Version name:** `0.1.0` (version code starts at `1`; EAS production uses `autoIncrement`)

---

## Prerequisites (operator — one-time)

1. Expo account + `npm i -g eas-cli` then `eas login`
2. From `mobile/`:
   ```bash
   eas init
   ```
   Copy the Project ID into `.env`:
   ```bash
   EXPO_PUBLIC_EAS_PROJECT_ID=<uuid>
   EXPO_PUBLIC_API_BASE_URL=https://efficiencyarchitects.online
   ```
3. Google Play Console app created with package **`com.efficiencyarchitects.simplifiorb`**
4. Play Console → Setup → API access → create service account → download JSON to:
   ```
   mobile/google-play-service-account.json
   ```
   (gitignored — never commit)
5. Android upload keystore registered in EAS matching Play upload SHA1:
   `F7:5F:38:06:A3:CF:75:84:AA:92:35:B6:8E:80:A4:CD:4F:8C:00:1B`
   (package `com.efficiencyarchitects.simplifiorb` on `@efficiency-architects/simplifi-mobile`)
   ```bash
   eas credentials -p android
   ```
   Production → Keystore → **Upload existing** / keep the F7 key (do **not** generate a new key unless Play reset was approved)

---

## Build production AAB

```bash
cd mobile
cp .env.example .env   # fill EAS project id
npm install
npm run build:production:android
```

Equivalent:

```bash
eas build --profile production --platform android
```

- Profile `production` sets `android.buildType: app-bundle` and pins API to `https://efficiencyarchitects.online`
- Download the `.aab` from the EAS build page when complete

### Verify before upload

- [ ] Build status **Finished** on expo.dev
- [ ] Artifact is **.aab** (not debug APK)
- [ ] Package name `com.efficiencyarchitects.simplifiorb`
- [ ] Signing cert SHA1 matches Play Console upload cert
- [ ] Icons present (`assets/icon.png`, `adaptive-icon.png`)

---

## Submit to Internal Testing

```bash
npm run submit:production:android
# or
eas submit --platform android --profile production-android --latest
```

Or upload the AAB manually in Play Console → Testing → Internal testing → Create release.

Then:

1. Add internal testers (email list / Google Group)
2. Copy the internal testing opt-in link
3. Testers install from Play Store (internal track)

---

## Store listing (minimum for Internal)

Use `store-listing/LISTING.md` and `ASSET-CHECKLIST.md`.

**Must complete in Console before broader tracks:**

- Privacy Policy URL
- Data Safety (`store-listing/data-safety.json`)
- Content rating questionnaire
- Phone screenshots (capture from device after first install)

Feature graphic: if Console rejects aspect ratio, resize `feature-graphic.png` to **1024×500**.

---

## Required environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | `.env` / EAS `production.env` | API host (apex) |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | `.env` | EAS project UUID |
| Backend: `RESEND_*`, `AIRTABLE_*`, `BLOB_*`, `STRIPE_*`, portal secrets | Vercel Production | Magic link + captures (not in the AAB) |

Mobile app does **not** embed Stripe/Resend/Airtable keys.

---

## In-app legal

First launch shows `/legal-accept` (EULA, Terms, Privacy, AI Disclosure). Acceptance stored in SecureStore (`simplifi_orb_legal_accepted_v1`). Settings → Legal & support links the same URLs.

---

## Quality smoke (Internal testers)

1. Fresh install → legal accept → login magic link  
2. Brief (home) loads  
3. Capture URL or photo  
4. Workspace opens  
5. Settings: legal links + push + sign out  
6. Airplane mode: offline queue / graceful error (no crash)

---

## Known limitations

- Corner Orb UI remains on web PWA; native is Brief · Capture · Inbox · Settings  
- Voice dictate needs a **dev client**, not Expo Go  
- No native crash analytics SDK yet (not required for Internal Testing)  
- Content rating / audience questionnaires are Console-only (cannot be automated in repo)
- **Play screenshots must be captured from a real Android install** — see `store-listing/play-screenshots/README.md`  
- Account deletion API must be **deployed to production** before Play listing claims deletion

---

## Rollback

1. Play Console → Internal testing → halt rollout / deactivate release  
2. Or promote previous AAB as the active internal release  
3. If API regression: revert Vercel deployment; app points at apex host  
4. Do **not** rotate upload keystore without Play approval

---

## Track readiness (post this sprint)

| Track | Status |
|-------|--------|
| Internal Testing | Ready after operator completes EAS projectId + service account + first `eas build` + listing screenshots |
| Closed Testing | After Internal smoke + content rating + Data Safety |
| Open Testing | After Closed |
| Production | After Open + policy checks |

---

## File map

| Path | Role |
|------|------|
| `eas.json` | Build + submit profiles |
| `app.json` / `app.config.ts` | Package, icons, version, EAS projectId |
| `store-listing/` | Listing copy, Data Safety, assets |
| `GOOGLE-PLAY-RELEASE.md` | This document |
