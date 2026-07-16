# SIMPLIFI Orb System

The Orb is the **persistent visual intelligence layer** of SIMPLIFI — not a chatbot home, FAB, or help widget.

## Product model

| Layer | Role |
|-------|------|
| **Today’s Brief / surfaces** | Primary UI — opportunities, follow-ups, capture, calendar |
| **Global Orb** | Corner presence — observes, recommends, expands on tap |
| **Expanded panel** | Contextual intelligence + Ask / voice (only when opened) |
| **Language → route** | Ask / Speak uses `interpretOrbIntent` + `resolveOrbIntentHref` to open existing surfaces |

Chat-first shell at `/simplifi/orb` redirects to Brief. Experimental: `/simplifi/orb?chat=1`.

## Architecture

```text
SimplifiProductShell
├── SimplifiAppChrome (nav)
├── Current screen
└── GlobalOrb
    ├── Orb state engine (lib/orb)
    ├── Intent → route (lib/orb-os)
    └── Expanded panel (insight → recommendation → ask)
```

## Files

| Path | Purpose |
|------|---------|
| `lib/orb/` | Types, priority, derive-state, grounded copy, load-context |
| `lib/orb-os/intent.ts` | NL → surface |
| `lib/orb-os/routes.ts` | Surface → `/simplifi/*` hrefs; navigable vs session surfaces |
| `app/simplifi/components/GlobalOrb.tsx` | Resting orb + panel + route navigation + session overlays |
| `app/simplifi/components/session/SessionWorkspace.tsx` | Temporary inbox / opportunity workspace over the Brief |
| `app/simplifi/components/global-orb.css` | Navy / gold visuals, states, safe-area |
| `app/simplifi/components/SimplifiProductShell.tsx` | Shell wrapper |
| `app/simplifi/workspace/CompanionOrb.tsx` | Legacy companion (kept; not mounted on Brief) |

## States

Derived from Action Center + Brief only (no fabricated insights):

`offline` → `timeSensitive` → interaction (`listening` / `thinking` / `speaking`) → `opportunity` / `recommendation` / `discovery` → `quiet` / `idle`

## Route intents (Step 1)

Navigable from Orb Ask / Speak (and Ask page):

| Utterance examples | Opens |
|--------------------|-------|
| capture / save / remember | `/simplifi/capture` |
| inbox / opportunities | `/simplifi/inbox` |
| follow-ups / due | `/simplifi/follow-ups` |
| calendar / schedule | `/simplifi/calendar` |
| brief / priorities / today | `/simplifi/workspace` |
| settings | `/simplifi/settings` |
| portal | `/portal/{slug}` |
| unique search match | `/simplifi/opportunity/[id]` |

Generic questions still answer in the panel.

## Session workspaces (Step 2)

Some intents open a **temporary workspace over the Brief** instead of leaving the
page. The interface appears on intent and is dismissed when done (`Done` / Escape /
scrim), restoring the Brief underneath. These reuse data the Orb already holds
(`objects`) — no new fetch.

Session surfaces are listed in `ORB_SESSION_SURFACES`; `GlobalOrb.sessionViewForSurface`
maps each to a view.

| Intent | Session workspace |
|--------|-------------------|
| inbox / opportunities | Inbox list; rows open a quick view |
| follow-ups / due | `buildExpirationAlerts` + dated commitments; rows open quick view |
| calendar / schedule | Dated opportunities grouped by month; rows open quick view |
| capture / save | Quick capture textarea → `analyzeCaptureUrl` / `/api/portal/captures/analyze` |
| unique search match | Opportunity quick view (guidance triple + `OpportunityActions`) |

Everything else (brief / settings / portal / classic) still routes via
`resolveOrbIntentHref` (Step 1). The full `/simplifi/*` routes remain the deep-link /
full surfaces — e.g. capture's "More sources" (photos, URL) and each session footer
link out to them.

## Verification

```bash
node scripts/test-simplifi-orb-system-contract.mjs
node scripts/test-simplifi-orb-route-intents-contract.mjs
node scripts/test-simplifi-orb-session-workspace-contract.mjs
```

Open `/simplifi/workspace`, tap Orb, ask “show my inbox” — a session workspace opens
in place over the Brief; `Done` restores the Brief. Ask a name that matches one
opportunity — its quick view opens with snooze / outcome actions.
