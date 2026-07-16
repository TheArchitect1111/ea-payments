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
| `lib/orb/` | Types, priority, derive-state, grounded copy, load-context, ambient openers |
| `lib/orb-os/intent.ts` | NL → surface; `buildAmbientOpening` |
| `lib/orb-os/routes.ts` | Surface → `/simplifi/*` hrefs; navigable vs session surfaces |
| `app/simplifi/components/GlobalOrb.tsx` | Resting orb + panel + route navigation + session overlays + ambient opener |
| `app/simplifi/components/session/SessionWorkspace.tsx` | Temporary inbox / opportunity / follow-ups / calendar / capture workspace over the Brief |
| `app/simplifi/components/global-orb.css` | Navy / gold visuals, liquid light, blossom panel, safe-area |
| `app/simplifi/components/SimplifiProductShell.tsx` | Shell wrapper + Chrome Fade resolution |
| `lib/simplifi/chrome-fade.ts` | Chrome Fade flag (cookie / env / localStorage) |
| `app/simplifi/workspace/CompanionOrb.tsx` | Legacy companion (kept; not mounted on Brief) |

## Orb v2 — living companion (presentation)

Upgrade of materials, motion, and copy. State engine and intent routing unchanged.

### Materials

| Token | Value | Role |
|-------|-------|------|
| `--orb-navy` / `--orb-navy-deep` | `#1b2b4d` / `#121c33` | Midnight shell |
| `--orb-gold` | `#c9a844` | Warm core light |
| `--orb-champagne` | soft gold halo | Presence without neon |
| Glass highlight | inset white + soft depth | Organic, not FAB lift |

Resting diameter: **56px**. Soft box-shadow only (no plastic FAB lift).

### Animation timing

| Motion | Duration | Notes |
|--------|----------|-------|
| Halo breathe | **7s** | Quiet: 10s; never bounce/flash |
| Liquid light (core) | **~15s** | GPU `transform` / `opacity` only |
| Thinking plasma | **8s** | Subtle drift — not a spinner |
| Outcome bloom | **1.2s** | Then return to derived state |
| Panel blossom | **0.32s** | `transform-origin: bottom right` |

Tab hidden → `data-paused="true"` → `animation-play-state: paused`.  
`prefers-reduced-motion: reduce` disables liquid, breathe, and blossom.

### Copy rules

- **Never** greet with “How can I help?”
- Ambient leads with value (“While you were away…”) or quiet clarity (“Your day is clear.”)
- Panel order: greeting / ambient → findings → recommendation → Ask last
- Ask placeholder: “Ask about your workspace…” (secondary)

### Panel (blossom)

- Light scrim; page remains readable
- Anchored lower-right above mobile dock (`bottom` clears dock + safe-area)
- Intelligence before conversation; greeting de-duped when ambient opener is shown

## States

Derived from Action Center + Brief only (no fabricated insights):

```text
offline → timeSensitive → listening/thinking/speaking
  → opportunity / recommendation / discovery
  → success / learning / celebration (transient flashes)
  → quiet → idle
```

| State | Visual language |
|-------|-----------------|
| idle | Deep navy, gold core, soft halo |
| quiet | Dimmer core, slower breathe |
| listening | Brighter gold, expanded halo |
| thinking | Slow liquid plasma in core |
| speaking | Faster soft breathe |
| opportunity | Emerald + gold core |
| recommendation | Warmer halo |
| timeSensitive | Deep amber halo (never bright red) |
| learning | Gold + purple accent |
| offline | Muted gray, no breathing |
| success / celebration | Short gold bloom |

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

## Ambient openers (Step 3)

When the Orb expands for the first time on a page load, it speaks a grounded
value-first opener from `buildAmbientOpeningFromSession` — greeting + up to 3 titles
from Action Center `needsAttention` and Brief items only. Quiet path: “Your day is clear.”
Attention path: “While you were away…” — never “How can I help?”

| Surface | Behavior |
|---------|----------|
| GlobalOrb expand (first open) | Full ambient opener + **Review them** → inbox session when findings exist |
| Brief (`/simplifi/workspace`) | Lead line via `buildBriefAmbientLead` (count only; list is already on the page) |
| Orb OS Preview shell | Same helper (shared with GlobalOrb) |

Helpers live in `lib/orb/ambient.ts` and reuse `buildAmbientOpening` from `lib/orb-os`.

## Outcome states (Step 4)

After a **real** user action succeeds, the resting Orb briefly flashes an outcome
visual (CSS already existed; previously unused). Flashes last ~1.2s and override
display via `outcomeFlash` — they are **not** pushed into `deriveOrbSession`
(priority would lose to attention states).

| Real event | Visual |
|------------|--------|
| Capture saved (session CaptureView) | `success` (bloom) |
| Opportunity marked won | `success` |
| Build Intelligence returns data | `learning` (purple core) |
| Snooze / in progress / pass / archive | none (inline note only) |
| `celebration` | reserved — not wired until a genuine milestone exists |

Wiring: `GlobalOrb.flashOutcome` → `SessionWorkspace.onOutcomeFlash` →
`CaptureView` / `OpportunityActions` (optional prop; full opportunity page works without it).

## Chrome Fade (Step 5)

Opt-in compact navigation for denser users. **Default chrome is unchanged.**
Brief remains home. Chat-first Orb is still legacy (`/simplifi/orb?chat=1`).

| Layer | Value |
|-------|-------|
| Env | `NEXT_PUBLIC_SIMPLIFI_CHROME_FADE` |
| Cookie / localStorage | `ea-simplifi-chrome-fade` |
| API | `GET/POST /api/simplifi/chrome-fade` |
| Toggle | Settings → SIMPLIFI Orb → Chrome Fade |

When enabled:

- Header uses `sw-header--fade` (tighter padding)
- Brief / Capture / Inbox links hide
- Brand (→ workspace), Settings, and Portal / Sign in stay
- Orb Ask + session workspaces cover the hidden surfaces

Helpers: `lib/simplifi/chrome-fade.ts`. `SimplifiProductShell` resolves the preference
client-side and listens for toggle events.

## Channels / native (Step 6)

Every capture door feeds the **same** `submitCapture` → Airtable →
`loadSimplifiWorkspace` / `loadOrbWorkspaceSlice` loop. No second product.

| Channel | Front door | Auth | Lands in Brief / Orb |
|---------|------------|------|----------------------|
| Web / PWA capture | `POST /api/portal/captures/analyze` | Portal cookie | Yes — `SimplifiProductShell` + GlobalOrb |
| PWA share sheet | `GET /simplifi/capture?title&text&url` → analyze | Portal cookie | Yes — `parseShareTargetParams` seeds URL + notes |
| Browser extension | `POST /api/capture/ingest` | Extension HMAC token | Yes — same portalSlug records; Brief via `/api/extension/brief` |
| Mobile (Expo) | `POST /api/portal/captures/analyze` | Bearer magic-link | Yes — Brief/Inbox tabs; Orb UI deferred to web |
| Amplifi share | `POST /api/portal/captures/analyze` | Portal cookie | Yes — share-story UX branch, same captures |

Notes-only shares (no URL) are accepted by analyze and enter the pipeline as text assets.
Orb capture intents seed `?url=` for links or `?text=` for notes.
Extension `SIMPLIFI_DAILY_BRIEF` prefers the server Brief (same workspace loader as web).

## Verification

```bash
node scripts/test-simplifi-orb-system-contract.mjs
node scripts/test-simplifi-orb-route-intents-contract.mjs
node scripts/test-simplifi-orb-session-workspace-contract.mjs
node scripts/test-simplifi-orb-ambient-openers-contract.mjs
node scripts/test-simplifi-orb-outcome-states-contract.mjs
node scripts/test-simplifi-chrome-fade-contract.mjs
node scripts/test-simplifi-channels-contract.mjs
```

Open `/simplifi/workspace` — full nav by default. Settings → enable Chrome Fade —
Brief/Capture/Inbox links disappear; brand + Settings remain; Orb still opens inbox /
capture sessions. Share a link or note to the Simplifi PWA — capture opens with
URL/notes seeded and saves into the same Inbox the Orb reads.
