# EA Experience Audit — Implementation Gap (Pass 2 → worktree)

| Field | Value |
|---|---|
| **Purpose** | Classify every Pass 2 recommendation vs audited SHA and dirty worktree; lock corrected nav target; define smallest remaining scope |
| **Audited product commit** | `545c6251bec86fc692ded933402cde3fb59797f8` |
| **Worktree** | Dirty / uncommitted relative to `545c6251` (HEAD ≡ SHA; deltas are WIP) |
| **Pass 1** | `docs/audits/EA-EXPERIENCE-AUDIT-PASS-1.md` |
| **Pass 2** | `docs/audits/EA-EXPERIENCE-AUDIT-PASS-2.md` |
| **Audit date** | 2026-07-23 |
| **Product code changed by this report** | None |
| **Implementation started** | No |

### Classification legend

| Class | Meaning |
|---|---|
| **Already implemented in worktree** | Present in dirty tree; **absent or different** at `545c6251`; not production-certified |
| **Partially implemented** | Meaningful WIP exists; Pass 2 intent incomplete |
| **Not implemented** | Same as SHA (or absent) for this recommendation |
| **Conflicts with current architecture** | Would fight Portal Chassis / module registry / CX shell patterns |
| **Requires runtime testing** | Cannot close without authenticated CX/MCC session evidence |

---

## 0. Corrected target navigation (canonical)

Pass 2 §5.1 originally allowed “Messages *or* Contact” and §5.3 listed Messages ahead of Documents. **Locked correction:**

| Order | Label | Route | Chrome |
|---:|---|---|---|
| 1 | **Your Project** | `/portal/{slug}/ctp/progress` | Primary home |
| 2 | **Documents** | `/portal/{slug}/ctp/documents` | Primary |
| 3 | **Contact** | `/portal/{slug}/ctp/messages` | Primary |
| 4 | **Help** | `/portal/{slug}/ctp/support` | Primary (self-serve; see §2.2) |
| — | **Journey** | `/portal/{slug}/ctp` | Secondary / quiet — not equal primary |
| — | **Log out** | `/api/portal/logout` | Account |

**Worktree vs corrected order:** labels match; **order does not** — Contact is currently before Documents in `lib/ctp-client-nav.ts`. Journey utilities in `lib/ctp-opportunity-view.ts` already use Your Project → Documents → Contact (no Help crumb).

---

## 1. Recommendation-by-recommendation matrix

### R1 — Client primary nav: Your Project home first; Journey quiet

| | |
|---|---|
| **Pass 2** | §5.1 — Progress → Your Project; Journey secondary |
| **At `545c6251`** | `buildClientExperienceNav`: Your Journey → Progress → Documents → Messages → Support, all equal primary (`lib/ctp-client-nav.ts`). `ClientExperienceNav` maps all items equally; `aria-label="Client experience"`; plain Log out. |
| **Worktree** | `lib/ctp-client-nav.ts` L30–37: Your Project → Contact → Documents → Help → Journey. Default active `progress`. `ClientExperienceNav.tsx` L19–55: filters Journey to `cex-shell-link-quiet`; Account `<details>` for logout; `aria-label="Your project"`. CSS `.cex-shell-link-quiet` in `client-experience-shell.css` L131–134 (+ mobile). Progress page kicker/title “Your Project” (`ctp/progress/page.tsx`). |
| **Class** | **Partially implemented** |
| **Gap** | Reorder to **Your Project / Documents / Contact / Help**; optionally nest Journey under Account (still quiet-in-row). Align FAQ “Your Journey” phrasing with nav label **Journey**. |

### R2 — Human channel labeled Contact (not Messages); Help not twin Support

| | |
|---|---|
| **Pass 2** | §5.1 — pick Contact; remove Support-as-peer-of-Messages naming |
| **At SHA** | Labels Messages + Support |
| **Worktree** | Nav Contact + Help; pages `ctp/messages` title “Contact your guide”, `ctp/support` title “Help”; `lib/ctp-emotional-copy.ts` navLabels; chassis `portal-nav-config.ts` Messaging → Contact; `experience-registry` Messaging → Contact |
| **Class** | **Already implemented in worktree** (labels/pages) |
| **Gap** | Residual comment `lib/ctp-support-view.ts` L2 “Messages & Support”; guide FAQ answer still says “Checking Progress” (`lib/ctp-guide-progress.ts` L228). Cosmetic only. |

### R3 — Unified Help (one persistent control; FAQ inside Assistant; no dual FAB)

| | |
|---|---|
| **Pass 2** | §5.2 |
| **At SHA** | FAQ FAB (`PortalCtpHelpDrawer`) + Assistant trigger **Help** + Support page + Messages page |
| **Worktree** | CX assistant labels (`CX_ASSISTANT_LABELS`, trigger **Need a hand?**) wired in `EAAssistant.tsx` L297–321 when CTP path/shell. FAQ drawer restyled (`cex-help-*`) but **still mounted** from `PortalSubpage.tsx` L67. FAB label also **Need a hand?** (`ctp-emotional-copy.ts` L37) → **duplicate same CTA**. Help **page** remains a primary nav destination (allowed by corrected §5.1). No FAQ content inside Assistant. No portal confusion auto-open (Pass 2: only on meaningful signals — still none). |
| **Class** | **Partially implemented** |
| **Gap** | Remove or demote FAQ FAB; surface `CTP_FAQ_ITEMS` inside Assistant (or Help page only — pick one float). Keep Help nav page OR fold answers into Assistant — do not ship three “Need a hand?” surfaces. |
| **Architecture** | Does **not** conflict — reuse Assistant + existing FAQ module; avoid new help microservice. |

### R4 — FAQ truthfulness (Your Project / Documents / Contact / Help / Journey)

| | |
|---|---|
| **Pass 2** | §5.3 (corrected labels) |
| **At SHA** | Stale: Design Studio under Progress, Overview, Scheduling, Messages & Support (`lib/ctp-faq.ts`) |
| **Worktree** | `lib/ctp-faq.ts` rewritten to Your Project / Contact / Documents / Help / Journey language |
| **Class** | **Already implemented in worktree** |
| **Gap** | Minor: FAQ says “Your Journey” while nav quiet label is “Journey”; order of names in FAQ intro lists Contact before Documents — align to corrected order when touching file. |

### R5 — MCC: keep Operate 7; nest Build peers under Factory; wire or delete `readOperatingMode`

| | |
|---|---|
| **Pass 2** | §5.4 |
| **At SHA** | `EXECUTIVE_NAV` 7 + `BUILDER_NAV` 11 always rendered as sibling Operate/Build groups (`lib/admin-operating-mode.ts`, `lib/platform/admin-workspace-chrome.ts` L60–70). `readOperatingMode` / `writeOperatingMode` defined, **zero importers**. |
| **Worktree** | **No diff** on `admin-operating-mode.ts` or `admin-workspace-chrome.ts` vs SHA. Master page only wraps Website Portal ops in `<details>` — not Build nesting. |
| **Class** | **Not implemented** |
| **Gap** | Smallest path: (a) collapse factory tool links under EA Factory parent in chrome, **or** (b) delete unused mode API and stop implying modes. Prefer (a) for Pass 2 intent; (b) is acceptable debt cleanup if nesting slips. |
| **Architecture** | Nesting under Factory **fits** existing `PortalSidebarNavGroup` — no conflict. Full Operate/Build mode toggle UI would be larger than needed; do not rebuild MCC. |

### R6 — Soft-redirect executive dual surfaces for CX clients

| | |
|---|---|
| **Pass 2** | §5.5 |
| **At SHA** | Soft-redirect helper **absent**; executive `/documents`, `/messaging`, `/ask`, etc. live |
| **Worktree** | New `lib/ctp-executive-surface-redirect.ts`; wired on: `documents`, `messaging`, `updates`, `ask`, `resources`, `notifications` pages under `app/portal/[slug]/` |
| **Class** | **Already implemented in worktree** (source) |
| **Gap** | **Requires runtime testing** before calling done (CX session still Blocked in Pass 1). Optional: audit remaining executive routes (e.g. pulse, learning) if deep-linked for CTP clients — out of smallest scope unless found in emails. |

### R7 — Verification before calling CX “done”

| | |
|---|---|
| **Pass 2** | §5.6 |
| **At SHA / production** | Cert password → `requires2fa`; no session; R13–R18/R28 Blocked (Pass 1 §8) |
| **Worktree** | Auth route WIP exists; does not unlock inbox 2FA or prod HMAC secret |
| **Class** | **Requires runtime testing** (Not implemented as evidence) |
| **Gap** | Unlock R30 (2FA code, admin show/enter, or prod `ADMIN_SESSION_SECRET`), then re-run R13–R18, R28 only. |

### R8 — Proactive Assistant open on meaningful signals only

| | |
|---|---|
| **Pass 2** | §5.2 (proactive open constraint) |
| **At SHA / worktree** | FAQ: click / `#faq` only. Assistant: user toggle; live signals update brief, no confusion auto-open |
| **Class** | **Not implemented** (and **should stay deferred** until dual-FAB removed) |
| **Architecture** | No conflict; avoid “open on every page load.” |

### R9 — What not to do (Pass 2 §6)

| Guardrail | Status |
|---|---|
| Do not rebuild Portal Chassis / CX | **Respected** in WIP |
| Do not reopen Experience Director v1 | **Respected** |
| Do not treat dirty worktree as shipped @ SHA | **Still true** — production product ≡ `545c6251` / docs-child `37577a3` |
| Do not expand Build peers | **Respected** (unchanged flat list) |

No recommendation classified **Conflicts with current architecture**. Nesting Build and unifying Help are refactor-in-place.

---

## 2. Side-by-side: SHA vs worktree (key files)

| File | `545c6251` | Dirty worktree |
|---|---|---|
| `lib/ctp-client-nav.ts` | Journey-first; Progress/Messages/Support | Your Project/Contact/Documents/Help/Journey — **wrong primary order** |
| `app/portal/components/ClientExperienceNav.tsx` | Equal primaries | Quiet Journey + Account menu |
| `app/portal/components/client-experience-shell.css` | No quiet link / help cream FAB set | Quiet + account + help FAB styles + mobile |
| `lib/ctp-faq.ts` | Stale Overview/Scheduling/Messages & Support | Aligned CX labels |
| `lib/ctp-executive-surface-redirect.ts` | Absent | Present + 6 page call sites |
| `app/portal/components/PortalCtpHelpDrawer.tsx` | FAQ FAB | Restyled FAB; still separate float |
| `lib/assistant/constants.ts` | `ASSISTANT_LABELS` only | + `CX_ASSISTANT_LABELS`, `CX_SURFACE_EYEBROW` |
| `app/components/ea-assistant/assistant-labels.tsx` | Absent | Provider for label swap |
| `app/components/ea-assistant/EAAssistant.tsx` | Trigger Help | CTP → CX labels when path/shell |
| `lib/admin-operating-mode.ts` | Flat Build 11; dead mode API | **Unchanged** |
| `lib/platform/admin-workspace-chrome.ts` | Operate + Build sibling groups | **Unchanged** |
| `lib/ctp-guide-progress.ts` / emotional copy / opportunity view | Older Progress language | Mostly Your Project / Contact / Help |
| Trust / LegalReacceptance / `/admin/legal` | Absent @ SHA | Present in WIP — **out of Pass 2 scope**; do not block CX gap close |

---

## 3. Smallest remaining implementation scope

Launch impact: finish client mental-model lock and dual-help collision without redesigning Chassis or MCC product surface area.

### Must-do (CX — before claiming Pass 2 shipped)

1. **Nav order lock** — In `lib/ctp-client-nav.ts`, set primary order to:
   `Your Project → Documents → Contact → Help`, then Journey (quiet). One-line reorder; sync any tests/docs that quote order.
2. **Kill dual “Need a hand?”** — Choose **one** float on CTP `PortalSubpage` routes:
   - **Preferred:** keep `EAAssistant` (CX labels); stop mounting `PortalCtpHelpDrawer` from `PortalSubpage.tsx`; expose FAQ via Assistant panel section **or** Help page only.
   - **Acceptable alternate:** keep Help page + FAQ drawer; hide Assistant on CTP client shell (worse — loses path briefs). Prefer first.
3. **Microcopy sweep (tiny)** — Replace residual “Checking Progress” (`ctp-guide-progress.ts` L228); FAQ “Your Journey” → Journey or “Your Journey (Journey in the menu)”; update `ctp-support-view.ts` header comment.

### Should-do (MCC — same sprint only if capacity)

4. **Build cafeteria** — In `admin-workspace-chrome.ts` / `BUILDER_NAV`, nest tool destinations under EA Factory (single expandable parent or Factory-only top link + in-page tools). Delete **or** wire `readOperatingMode` — do not leave dead mode API implying a toggle.

### Must-verify (no code claim without evidence)

5. **Auth CX runtime** — Complete Pass 1 R30 unlock; re-run R13–R18, R28 against production with cert tenant. Soft-redirects and nav labels stay **Requires runtime testing** until then.

### Explicitly out of smallest scope

- Trust Center / LegalReacceptance / `/admin/legal` (separate track).
- Proactive Assistant auto-open.
- Experience Director v1 changes.
- New help product or nav framework.
- Expanding MCC Build with more peers.

---

## 4. Remaining work checklist (implementation when authorized)

| # | Task | Files (expected) | Depends on |
|---:|---|---|---|
| G1 | Reorder CX nav to Your Project / Documents / Contact / Help | `lib/ctp-client-nav.ts` | — |
| G2 | Remove FAQ FAB mount; FAQ via Assistant and/or Help page | `PortalSubpage.tsx`, `EAAssistant` / brief UI, optionally deprecate FAB in `PortalCtpHelpDrawer.tsx` | G1 optional |
| G3 | Residual Progress / Your Journey copy | `lib/ctp-guide-progress.ts`, `lib/ctp-faq.ts`, `lib/ctp-support-view.ts` | — |
| G4 | Nest Build under Factory **or** delete dead mode helpers | `lib/admin-operating-mode.ts`, `lib/platform/admin-workspace-chrome.ts` | Owner call |
| G5 | Authenticated runtime cert of nav/help/redirects | Pass 1 §8 R13–R18, R28 | 2FA / secret / admin enter |

**Estimated surface area if authorized:** ~3–6 files for G1–G3; +1–2 for G4; G5 evidence only.

---

## 5. Scorecard summary

| Pass 2 recommendation | SHA | Worktree | Class |
|---|---|---|---|
| R1 Nav home + quiet Journey | Journey-first equal | Mostly done; **order wrong** | Partially implemented |
| R2 Contact + Help naming | Messages/Support | Done | Already implemented in worktree |
| R3 Unified Help / single float | Dual floats | Labels only; FAB remains | Partially implemented |
| R4 FAQ rewrite | Stale | Done | Already implemented in worktree |
| R5 MCC Build nest / mode API | Flat + dead API | Unchanged | Not implemented |
| R6 Soft-redirect dual surfaces | Absent | Helper + 6 pages | Already implemented in worktree + Requires runtime testing |
| R7 Auth verification | Blocked | Still Blocked | Requires runtime testing |
| R8 Proactive open | None | None | Not implemented (defer) |

**Conflicts with current architecture:** none for the smallest scope above.

---

## 6. Sign-off

| Item | Value |
|---|---|
| Gap analysis complete | **Yes** |
| Report path | `docs/audits/EA-EXPERIENCE-AUDIT-IMPLEMENTATION-GAP.md` |
| Canonical nav target | **Your Project / Documents / Contact / Help** (+ quiet Journey) |
| Code modified for product | **None** |
| Pass 2 §5.1/§5.3 corrected | **Yes** (label/order lock) |
| Implementation authorized | **No** |

*End of implementation gap report.*
