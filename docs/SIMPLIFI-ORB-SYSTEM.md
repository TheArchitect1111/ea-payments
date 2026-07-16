# SIMPLIFI Orb System

The Orb is the **persistent visual intelligence layer** of SIMPLIFI — not a chatbot home, FAB, or help widget.

## Product model

| Layer | Role |
|-------|------|
| **Today’s Brief / surfaces** | Primary UI — opportunities, follow-ups, capture, calendar |
| **Global Orb** | Corner presence — observes, recommends, expands on tap |
| **Expanded panel** | Contextual intelligence + Ask / voice (only when opened) |

Chat-first shell at `/simplifi/orb` redirects to Brief. Experimental: `/simplifi/orb?chat=1`.

## Architecture

```text
SimplifiProductShell
├── SimplifiAppChrome (nav)
├── Current screen
└── GlobalOrb
    ├── Orb state engine (lib/orb)
    └── Expanded panel (insight → recommendation → ask)
```

## Files

| Path | Purpose |
|------|---------|
| `lib/orb/` | Types, priority, derive-state, grounded copy, load-context |
| `app/simplifi/components/GlobalOrb.tsx` | Resting orb + panel |
| `app/simplifi/components/global-orb.css` | Navy / gold visuals, states, safe-area |
| `app/simplifi/components/SimplifiProductShell.tsx` | Shell wrapper |
| `app/simplifi/workspace/CompanionOrb.tsx` | Legacy companion (kept; not mounted on Brief) |

## States

Derived from Action Center + Brief only (no fabricated insights):

`offline` → `timeSensitive` → interaction (`listening` / `thinking` / `speaking`) → `opportunity` / `recommendation` / `discovery` → `quiet` / `idle`

## Verification

```bash
node scripts/test-simplifi-orb-system-contract.mjs
```

Open `/simplifi/workspace`, confirm corner Orb, tap for panel with real Brief findings when signed in.
