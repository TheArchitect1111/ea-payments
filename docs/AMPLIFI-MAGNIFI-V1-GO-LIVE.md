# Amplifi + Magnifi V1 — Client Go-Live

**Status:** LIVE / Client Use GO  
**Date:** 2026-07-27  
**Scope:** Capture → Magnifi story → Amplifi draft/share. Nothing auto-posts.

## Production links

| What | URL |
|------|-----|
| Portal login | https://efficiencyarchitects.online/portal/login |
| Internal demo (one-click) | https://efficiencyarchitects.online/api/auth/demo-enter?next=/portal/demo-client/amplifi |
| Demo portal | https://efficiencyarchitects.online/portal/demo-client |
| Cheat sheet | `docs/AMPLIFI-MAGNIFI-CLIENT-CHEAT-SHEET.md` |

## Entitled for V1 (simplifi + amplifi)

| Org | Portal slug | Role |
|-----|-------------|------|
| Acme Roofing Field Demo | `acme-roofing-field-demo-a9be53` | Pilot |
| Acme Roofing Field Demo | `acme-roofing-field-demo-033032` | Pilot sibling |
| Acme Roofing Field Demo | `acme-roofing-field-demo-73b9e6` | Pilot sibling |
| Acme Roofing Field Demo | `acme-roofing-field-demo-4aaadf` | Pilot sibling |
| Amanda Catherine | `amanda-catherine` | Eligible client |
| Ascension Systems | `s-f5b5bb` | Eligible client |
| Demo Client | `demo-client` | Internal fixture |

Client URL pattern: `https://efficiencyarchitects.online/portal/{slug}`

## 5-minute client walkthrough

1. Open https://efficiencyarchitects.online/portal/login — enter email on file.
2. Open **Simplifi** → capture a URL or short note.
3. Open the **Magnifi** story from the result.
4. Open **Amplifi** → Open latest Magnifi / Review draft.
5. Copy the draft and post it yourself (LinkedIn / Instagram / email).

Remind them:

- Amplifi does **not** auto-post.
- Magnifi links are **public** — archive the capture to retire a story.

## Operator: turn on another waiting client

```bash
node scripts/pilot-amplifi-magnifi-client.mjs --env-file path/to/.env.local --entitle <portal-slug>
node scripts/pilot-amplifi-magnifi-client.mjs --smoke <portal-slug>
```

Or: Mission Control → Capability Marketplace → Entitlements → enable `simplifi` + `amplifi`.

## Not in V1 (say no for now)

- Auto-publish / campaign calendar (Amplifi Communications)
- Private (session-gated) Magnifi
- Church / school / nonprofit industry packs
- People directory (next chassis track)

## Smoke status (2026-07-27)

- Phase 5 portal cert: PASS  
- Amplifi+Magnifi ops health: **healthy**  
- Capture → Magnifi → Amplifi loop: PASS on `demo-client`
