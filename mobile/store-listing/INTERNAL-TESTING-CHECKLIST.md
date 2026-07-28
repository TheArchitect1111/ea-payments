# Simplifi Orb — Google Play Internal Testing checklist

**Package:** `com.efficiencyarchitects.simplifiorb`  
**Version name:** `0.1.0`  
**Version code:** `1` (+ EAS `autoIncrement` on production profile)  
**Track:** Internal Testing  

## Engineering complete in this sprint

- [x] Account deletion in Settings (confirm → `POST /api/simplifi/account/delete`)
- [x] Public deletion URL `/legal/account-deletion` (Play Console web path)
- [x] Privacy Policy documents in-app + web deletion process
- [x] Auth callback “Back to login”
- [x] API request timeouts (45s)
- [x] Removed debug API base URL from Settings
- [x] Feature graphic `1024×500`
- [x] Icons wired (`icon.png`, `adaptive-icon.png`, `icon-512.png`)
- [x] Privacy / Terms / EULA / AI / Support URLs live on apex

## Operator / Console (required before READY)

- [ ] Deploy backend so `/api/simplifi/account/delete` + `/legal/account-deletion` are on production
- [ ] Rebundle + deploy Privacy Policy markdown (`npm run` / `node scripts/bundle-legal-markdown.mjs`)
- [ ] Capture **real native** screenshots into `store-listing/play-screenshots/` (see README there)
- [ ] `eas build --profile production --platform android`
- [ ] `eas submit` → Internal Testing **or** manual AAB upload
- [ ] Paste Data Safety from `store-listing/data-safety.json`
- [ ] Set Account deletion URL: `https://efficiencyarchitects.online/legal/account-deletion`
- [ ] Content rating (IARC) questionnaire
- [ ] Target audience / age (not Families)
- [ ] Ads declaration: No
- [ ] Add internal testers + opt-in link
- [ ] Device smoke: legal → login → brief → capture → workspace → delete account (test tenant) → push

## Do not do in this sprint

- Smartchitecture / P1
- Crash analytics SDK
- Marketing screenshot uploads
- Feature redesign
