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
| `lib/orb-os/routes.ts` | Surface → `/simplifi/*` hrefs |
| `app/simplifi/components/GlobalOrb.tsx` | Resting orb + panel + route navigation |
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

## Verification

```bash
node scripts/test-simplifi-orb-system-contract.mjs
node scripts/test-simplifi-orb-route-intents-contract.mjs
```

Open `/simplifi/workspace`, tap Orb, ask “show my inbox” — should navigate to Inbox.
