# Amplifi + Magnifi — Portal-Ready Build Sequence

**Goal:** Make Magnifi and Amplifi safe, clear, and usable for **Simplifi-package / executive portal clients** — without building Amplifi Communications™ / Postiz (deferred).

**Out of scope for this sequence:** CTP Client Experience chrome (Your Project / Documents / Contact / Help). Those clients do not get Amplifi/Simplifi as primary nav by design.

**Launch impact:** Unlocks paid Simplifi portal value (capture → story → share) for entitled clients.

---

## Definition of done (portal-ready V1)

A entitled client can, without EA operator help:

1. Sign into `/portal/{slug}` and see **Simplifi** + **Amplifi** when entitled.
2. Capture an opportunity (Simplifi) and open a working **Magnifi** story link.
3. From Amplifi hub, open latest Magnifi, copy/share drafts, and understand next share action.
4. Never land on 404 Magnifi or an Amplifi hub with no explanation when empty.
5. Clients understand Magnifi links are **public-by-link** (warning copy + support SOP); session gate is backlog.

**Not required for V1 portal-ready:** Postiz, campaign calendar, auto-publish, server PDF, Chrome Web Store, Play Store.

---

## Sequence overview

| Phase | Name | Outcome | Depends on |
|------:|------|---------|------------|
| 0 | Scope lock | Package ↔ modules ↔ CX boundary written | — |
| 1 | Entitlement & chrome | Right clients see Amplifi/Simplifi | 0 |
| 2 | Magnifi reliability | Capture → story always resolves | 1 |
| 3 | Amplifi portal hub | Empty/full states + clear CTAs | 1–2 — **COMPLETE** |
| 4 | Share & access policy | Auth/public rules + copy | 2–3 — **COMPLETE** (session gate deferred) |
| 5 | Client QA cert | Real slug smoke + checklist | 1–4 — **COMPLETE** |
| 6 | Ops gate | Monitoring + support SOP | 5 — **COMPLETE** |

Do not start Phase 6 until Phase 5 passes on production.

---

## Phase 0 — Scope lock (½ day, docs only) — **COMPLETE 2026-07-25**

**Owner:** Product + architect  
**Deliverable:** Locked decisions below (evidence from registry, CX nav, Magnifi route, `docs/NOW.md`)

### Decisions (locked)

| # | Question | Decision | Evidence / rationale |
|---|----------|----------|----------------------|
| D0.1 | What is V1 portal-ready? | **Share + drafts + Magnifi story links only.** Not Amplifi Communications™, not Postiz, not campaign calendar, not auto-publish. | `docs/NOW.md` defers Communications; Amplifi module copy already says “not an automated research engine.” |
| D0.2 | Which portal tenants get Amplifi/Simplifi? | **Only packages that grant those modules:** `Simplifi` / `simplifi_early_access` → includes `simplifi`+`amplifi`; `Implementation Package` → same plus connect/member. **Not** Website + Portal Starter / `website_portal_starter` (lean portal set — no Amplifi). | Canonical: `@ea/payments-contract` presets/offers. Legacy `PACKAGE_MODULE_GRANTS` is fallback only. |
| D0.3 | CTP Client Experience chrome? | **Amplifi/Simplifi stay out of CX primary nav.** CX remains Your Project / Documents / Contact / Help (+ quiet Journey). No Amplifi tab for CTP CX clients in this sequence. | `lib/ctp-client-nav.ts` has no amplifi/simplifi; CX shell clears executive groups |
| D0.4 | Magnifi link access policy (V1) | **Keep public-by-link** (current `/magnifi/{id}` has no portal session gate). Portal UI + support copy must warn: anyone with the link can view. Session-gated Magnifi is **backlog** after portal-ready, not Phase 1–3. | `app/magnifi/[id]/page.tsx` loads by capture id only; matches Early Access share model; fastest path to portal-ready |

### Implications for later phases

- Phase 1 entitles **Simplifi / Implementation** slugs only; do not force Amplifi onto Website + Portal / CX tenants.
- Phase 4 implements **warnings + support SOP** for public links — not a Magnifi auth rewrite.
- Communications / Postiz remain explicit backlog (see below).

### Phase 0 checklist

- [x] Confirm V1 = share + drafts + Magnifi links (not Communications).
- [x] Confirm target tenants: Simplifi / Implementation packages only.
- [x] Confirm CTP CX stays Amplifi-free in primary nav.
- [x] Decide Magnifi link policy: **public-by-link + warnings** (session gate deferred).

**Exit:** Written decisions locked. No product code in Phase 0. **Ready for Phase 1.**

---

## Phase 1 — Entitlement & portal chrome — **COMPLETE 2026-07-25**

**Owner:** Engineering  
**Reuse:** `lib/modules/registry.ts`, `lib/entitlements.ts`, `requirePortalModule`, Portal Chassis, MCC EntitlementsPanel

### Findings (audit)

| Check | Result |
|-------|--------|
| Package → modules | **Already correct** via `@ea/payments-contract` (`SIMPLIFI_ONE_TIME_MODULES` / `IMPLEMENTATION_MODULES` include Amplifi; `WEBSITE_PORTAL_MODULES` does not) |
| Payment write | `fulfillPaidClient` → `ensurePackageEntitlements` → `syncPackageEntitlements` |
| Login backfill | `resolvePortalIdentity` → `ensurePackageEntitlements` |
| Executive chrome | Entitled modules drive sidebar; Amplifi when `amplifi` active |
| CX chrome | `shouldUseClientExperienceShell` → empty executive groups + CX nav only (no Amplifi) |
| Deep link | `requirePortalModule(slug, 'amplifi')` on Amplifi portal page |
| Operator grant | **MCC already exists** — no new script required |

### Operator backfill (no Stripe replay)

1. Sign in to Mission Control (`/admin/master`).
2. Open **Capability Marketplace** → **Entitlements** tab (`/admin/capability-marketplace`).
3. Select the client organization.
4. Enable modules **`simplifi`** and **`amplifi`** (or bulk-enable those ids).
5. Client reloads `/portal/{slug}` — Amplifi appears in executive chrome when not on CX shell.
6. Verify deep link: `/portal/{slug}/amplifi` loads when enabled; redirects home when disabled.

### Phase 1 checklist

- [x] Audit package → modules (contract + fulfillment + login backfill).
- [x] Document MCC EntitlementsPanel as the grant path (no new microservice).
- [x] Chrome: executive shows Amplifi when entitled; CX primary omits Amplifi; deep link guarded.
- [x] Focused tests: `node scripts/test-amplifi-magnifi-portal-phase1.mjs`

**Exit:** Architecture + operator path + contract tests green. **Ready for Phase 2** (Magnifi reliability). Runtime smoke on a live Simplifi slug remains Phase 5.

---

## Phase 2 — Magnifi reliability for portal clients — **COMPLETE 2026-07-25**

**Owner:** Engineering  
**Reuse:** Capture Records, `/magnifi/[id]`, Simplifi capture pipeline, Amplifi portal hub

### Shipped

| Item | Change |
|------|--------|
| Persist fail-closed | `sanitizeCaptureClientError` in `lib/capture-response.ts`; portal analyze + `toCaptureApiResponse` never return Airtable/schema internals |
| Magnifi URL on success | Unchanged contract: `/magnifi/{record.id}` when record saved; no URL when save fails |
| Broken-link UX | `app/magnifi/[id]/page.tsx` calm “Story unavailable” + links to workspace/capture (no raw `notFound`) |
| Amplifi surfacing | Empty: “Capture once…” primary CTA to portal Simplifi; with capture: “Open latest Magnifi story” |
| Workspace Magnifi | `captureToObject` always sets `/magnifi/{id}`; workspace button uses that href (not Consider-only) |
| Template sanity | Spot-checked `executive-transformation`, `entrepreneur-launch`, `hidden-asset-discovery` — hooks/journeys present; no copy fix required |

### Phase 2 checklist

- [x] Persist contract + client-safe Airtable failure messaging  
- [x] Calm Magnifi unavailable page  
- [x] Amplifi hub empty + latest Magnifi CTAs  
- [x] Simplifi workspace Magnifi link reliability  
- [x] Light template sanity (top 3)  
- [x] Focused tests: `node scripts/test-amplifi-magnifi-portal-phase2.mjs`

**Exit:** Code + contracts green. **Ready for Phase 3** (Amplifi hub polish). Production capture→Magnifi refresh smoke remains Phase 5.

---

## Phase 3 — Amplifi portal hub ready — **COMPLETE 2026-07-25**

**Owner:** Engineering + design tokens  
**Reuse:** `lib/amplifi-portal.ts`, `app/portal/[slug]/amplifi/*`, existing submit-for-approval API

### Shipped

| Item | Change |
|------|--------|
| Empty state | Hub shows “No Magnifi stories yet” + single primary CTA to portal Simplifi capture |
| Full state | Journey + stats + “Open latest Magnifi” + “Review draft before posting” |
| Loading | `app/portal/[slug]/amplifi/loading.tsx` → PortalRouteSkeleton |
| Error | Capture load failure → calm error panel with retry / Simplifi |
| Draft gate | Amplifi draft UI + StoryDraftPanel labeled “Review before posting”; manual share = “you post” |
| Submit fail-closed | `POST /api/portal/amplifi/submit-for-approval` requires `amplifi` entitlement (403 otherwise; demo-client exempt) |
| Copy | Disclaimer: nothing auto-posts; no Communications calendar / auto-publish framing |
| Mobile | Hub CTAs stack full-width ≥44px at ≤760/420px; draft tool platforms stack at ≤420px |

### Phase 3 checklist

- [x] Empty / loading / error states  
- [x] Draft quality gate + submit-for-approval entitlement gate  
- [x] Copy: amplify & share Magnifi — never imply auto-posting / Communications  
- [x] Mobile 390×844 usability (stacked CTAs)  
- [x] Focused tests: `node scripts/test-amplifi-magnifi-portal-phase3.mjs`

**Exit:** Hub understandable with zero captures and with ≥1 capture. **Ready for Phase 4** (share & access policy warnings).

---

## Phase 4 — Share & access policy — **COMPLETE 2026-07-25**

**Owner:** Product + engineering

**Public-by-link (LOCKED in Phase 0 — V1 path) — shipped:**

- [x] Portal and email copy warn: “Anyone with the link can view this story.”  
- [x] Support SOP: how to retire/unshare a sensitive capture (`docs/PRODUCT-SUPPORT-AND-TRIAGE-SOP.md`).

**Session gate for portal Magnifi — deferred (backlog after portal-ready):**

- [ ] Portal-origin Magnifi routes require portal session for that slug’s captures.  
- [ ] Public Consider demos (`/consider/selena`) unchanged.  
- [ ] Tests for auth allow/deny.

### Shipped

| Item | Change |
|------|--------|
| Policy helper | `lib/amplifi-share-policy.ts` — warning copy, `preferPortalMagnifiUrl`, archive = retired |
| Portal / draft / success | Public-link warning on Amplifi hub, Amplifi draft tool, CaptureSuccessPanel |
| Email | `sendCaptureReadyEmail` warns + CTA prefers Magnifi |
| Magnifi | CTA footer warning; **Archived** → “Story retired” (unshare) |
| Share prefer Magnifi | Portal captures API + story draft + AmplifiPostApp + CaptureSuccessPanel |
| SOP | Retire/unshare section in `docs/PRODUCT-SUPPORT-AND-TRIAGE-SOP.md` |
| Tests | `node scripts/test-amplifi-magnifi-portal-phase4.mjs` |

**Also:**

- [x] Amplifi share actions prefer portal Magnifi URL the client is allowed to use.  
- [x] No new social networks or Postiz.

**Exit:** Written policy + matching behavior in code. Production smoke remains Phase 5.

---

## Phase 5 — Client QA certification — **COMPLETE 2026-07-25**

**Owner:** Operator + engineering  
**Fixture:** `demo-client` (Simplifi/Amplifi entitled) via `GET /api/auth/demo-enter`  
**Host:** `https://efficiencyarchitects.online`  
**Evidence:** `docs/audits/AMPLIFI-MAGNIFI-PORTAL-PHASE5-CERT.json`  
**Runner:** `node scripts/cert-amplifi-magnifi-portal-phase5.mjs`

Checklist (production):

| # | Step | Pass? |
|---|------|:-----:|
| 1 | Login `/portal/demo-client` | ✓ |
| 2 | See Simplifi + Amplifi when entitled | ✓ |
| 3 | Capture URL or note | ✓ (`recASlCjVySaTEfxh` sample run; IDs vary) |
| 4 | Open Magnifi from result / workspace | ✓ |
| 5 | Refresh Magnifi — still loads | ✓ |
| 6 | Open Amplifi hub — story + share/drafts | ✓ |
| 7 | Non-entitled slug cannot open Amplifi | ✓ (unauth → login; Website+Portal package excludes `amplifi`) |
| 8 | Mobile 390×844 Amplifi + Magnifi | ✓ (Amplifi hub usable; Magnifi loads — see cert notes) |

**Notes**

- Phases 2–4 polish (public-link warnings, draft gate copy, archive→retired) may still be **local-only** until committed/deployed; this cert validates the **live portal-ready path** on production.
- `demo-enter?next=/portal/demo-website` currently still issues a `demo-client` session on production — treat as a separate defect; step 7 used unauth gate + package contract.
- Re-run: `node scripts/cert-amplifi-magnifi-portal-phase5.mjs https://efficiencyarchitects.online`

**Exit:** All rows pass on production host. **Ready for Phase 6** (ops & support gate).

---

## Phase 6 — Ops & support gate — **COMPLETE 2026-07-25**

**Owner:** Ops + engineering

### Shipped

| Item | Change |
|------|--------|
| Health probes | `lib/amplifi-magnifi-health.ts` — Magnifi sample/unavailable + Amplifi unauth/authed |
| Platform ops | `/api/health/ops` always includes Amplifi+Magnifi subsystem |
| Launch health | Diagnostic `products.amplifiMagnifiPortalReady` + probe detail (admin) |
| Uptime guidance | Pass-1 ops copy lists Magnifi + Amplifi monitors |
| Launch readiness | `validate-simplifi-launch-readiness.mjs` checks Magnifi calm page + Amplifi gates |
| Triage SOP | Empty Amplifi Hub + Entitlement Missing (+ existing Magnifi 404 / retire) |
| Tests | `node scripts/test-amplifi-magnifi-portal-phase6.mjs` |

### Phase 6 checklist

- [x] Uptime/health includes Magnifi sample + Amplifi auth-aware check  
- [x] Triage SOP: Magnifi unavailable, empty Amplifi, entitlement missing  
- [x] Re-run `node scripts/validate-simplifi-launch-readiness.mjs https://efficiencyarchitects.online`

**Exit:** Support can clear client Amplifi/Magnifi issues without engineering on call. **Portal-ready sequence complete.**

---

## Explicit backlog (after portal-ready)

Do **not** pull these into this sequence:

| Item | Why later |
|------|-----------|
| Amplifi Communications + Postiz | Deferred sprint; stack freeze |
| Server-side Magnifi PDF | Not V1 portal-ready |
| Full 10-template campaign polish | Scale, not portal unlock |
| Chrome Web Store / Play Store | Distribution, not portal hub |
| CTP CX Amplifi tab | Conflicts with Client Experience model |

---

## Suggested calendar (compressed)

| Day | Focus |
|----:|-------|
| 1 | Phase 0–1 |
| 2 | Phase 2 |
| 3 | Phase 3 |
| 4 | Phase 4–5 |
| 5 | Phase 6 + ship note |

---

## Architecture guardrails

- Route persistence through existing Capture Records / Airtable client — no fourth store.  
- Portal auth via `requirePortalModule` / portal sessions — no ad-hoc cookies.  
- Design tokens from existing portal/Amplifi CSS — no one-off brand hex sprawl.  
- Increase client capacity (clear story → share path); do not add Communications surface until Postiz sprint.

---

## Status

| Field | Value |
|-------|-------|
| Sequence created | 2026-07-25 |
| Phase 0 | **Complete** — decisions D0.1–D0.4 locked |
| Phase 1 | **Complete** — audit + MCC grant doc + `scripts/test-amplifi-magnifi-portal-phase1.mjs` |
| Phase 2 | **Complete** — Magnifi reliability + `scripts/test-amplifi-magnifi-portal-phase2.mjs` |
| Implementation started | Phases 1–2 verification/product polish |
| Next | Phase 3 — Amplifi portal hub ready |
| Depends on | Simplifi capture pipeline (already Early Access GO) |
