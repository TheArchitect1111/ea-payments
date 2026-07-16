# Orb OS Preview

Evolution path from classic Simplifi (Brief · Capture · Inbox) toward an **AI-native Opportunity Operating System** where **Orb** is the interface.

**Mode:** evolve, do not rebuild. Capture pipeline, opportunity model, inbox, ask/search, portal, and auth stay intact.

## Feature flag

| Mechanism | Effect |
|-----------|--------|
| Settings → **Enable Orb OS Preview** | Sets cookie `ea-orb-os-preview=1` |
| `NEXT_PUBLIC_ORB_OS_PREVIEW=true` | Env-wide preview (Vercel) |
| `/simplifi/orb?orb=1` | Force preview for this visit |
| `/simplifi/workspace?classic=1` | Force classic Brief UI |
| Say “classic Simplifi” / “exit Orb” | Leaves preview |

API: `POST /api/simplifi/orb-preview` `{ "enabled": true }`

## Phase coverage (this ship)

| Phase | Status |
|-------|--------|
| **1 — Orb First** | Done behind flag: greeting + Orb + composer; chrome hidden |
| **2 — Dynamic workspace** | Partial: ephemeral Brief / Inbox / Capture / Ask-search panels from intent |
| **3 — Ambient intelligence** | Partial: opening message from Action Center + Brief items |

## Intent → existing surfaces

| Language | Surface |
|----------|---------|
| capture / save / remember | Capture panel (+ existing `/simplifi/capture`) |
| brief / priorities / today | Ephemeral Brief |
| opportunities / inbox | Ephemeral Inbox (+ `/simplifi/inbox`) |
| find / search … | Semantic filter via `lib/simplifi-ask` |
| follow-ups / calendar | Existing routes |
| settings / portal | Existing routes |
| classic / exit orb | Classic workspace |

## Files

- `lib/orb-os/` — flag + intent
- `app/simplifi/orb/` — Orb OS shell
- `app/api/simplifi/orb-preview/` — cookie toggle
- Classic: `app/simplifi/workspace/` unchanged when preview off

## Rollback

Disable preview in Settings, or visit `/simplifi/workspace?classic=1`, or unset `NEXT_PUBLIC_ORB_OS_PREVIEW`.
