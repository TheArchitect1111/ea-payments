# EA Experience Audit — Pass 2 (Comprehension & Target Experience)

| Field | Value |
|---|---|
| **Pass** | 2 — Evaluation & simplest target experience |
| **Basis** | `docs/audits/EA-EXPERIENCE-AUDIT-PASS-1.md` (complete) |
| **Audited product commit** | `545c6251bec86fc692ded933402cde3fb59797f8` |
| **Production product equivalence** | Live `37577a3` = docs-only child of `545c6251` |
| **Audit date** | 2026-07-23 |
| **Product code changed** | None |
| **Recommendations implemented** | None |
| **Implementation started** | No |

### Evidence classes (mandatory)

| Class | Meaning | Use in scores |
|---|---|---|
| **S** | Source-verified at `545c6251` (Pass 1 registries) | Structure, labels, duplication, help wiring |
| **R** | Runtime-verified on production | Public login, auth gates, health, cert password→2FA |
| **B** | Runtime **Blocked** / **Failed** — not observed | Must **not** be assumed as working UX |

**Rule:** Authenticated Client Experience chrome, MCC chrome, dual-FAB layout, NBA presentation, FAQ drawer open state, Journey scenes, and soft-redirect behavior were **not** observed in session (Pass 1 R13–R28, R30–R32). Scores for those dimensions are **structure-inferred (S)** with a **runtime confidence penalty**, not “verified premium.”

---

## 1. Verdict

The platform’s foundation is strong (premium login surfaces, working public gates, a coherent Operate menu, a real Guide home at `/ctp/progress`). Confusion is **structural**, not cosmetic:

1. **Wrong home prominence** — cinematic **Your Journey** is primary nav #1; operational Guide is labeled **Progress**.
2. **Help is four products** — Support page + Messages page + FAQ FAB + Assistant “Help”.
3. **FAQ teaches a workspace that does not match the menu** — Overview, Scheduling, “Messages & Support”.
4. **MCC Build is a flat factory cafeteria** — 11 peers beside a tight 7-item Operate list.
5. **Authenticated in-product comprehension remains uncertified** — cert tenant stopped at portal 2FA.

**Overall (evidence-weighted): 61 / 100**  
(Preliminary narrative score was 65; Pass 2 lowers slightly because authenticated workflow verification stayed Blocked/Failed and cannot inflate presentation scores.)

---

## 2. Scoring method

Each area: **0–100**.  
Formula intent: `score ≈ structure_quality − confusion_penalty − (runtime_gap_penalty if area depends on auth)`.

| Area | Score | Dominant evidence | Runtime note |
|---|---:|---|---|
| Client comprehension | **58** | S: nav order, Messages vs Support, FAQ copy | Auth CX **Blocked** |
| MCC comprehension | **68** | S: Operate 7 vs Build 11; dead mode toggle | Auth MCC **Blocked** |
| Premium experience | **72** | R: public login visuals; S: CX/Journey investment | Auth premium **Blocked** |
| Role relevance | **70** | S: CX vs executive modules; RBAC matrices | Entitlement filtering **Blocked** |
| Navigation clarity | **55** | S: five equal primary CX links; Journey first | Auth nav **Blocked** |
| Contextual help | **48** | S: four help channels; no portal confusion triggers | FAQ/Assistant open **Blocked** |
| Mobile design | **52** | R Partial: public login @ 390×844; auth mobile **Blocked** | Dual FAB collision **Blocked** |
| Accessibility | **58** | S: some aria on drawers/nav; R: login labels | Focus traps / CX a11y **Blocked** |
| **Overall** | **61** | Weighted toward confusion drivers + runtime honesty | — |

### Score table (detail)

| Area | Score | What works (evidence) | What confuses (evidence) |
|---|---:|---|---|
| **Client comprehension** | 58 | Canonical landing helper → `ctp/progress` (S); Documents label clear (S) | Journey first (S); Progress understates Guide HQ (S); Messages≈Support (S) |
| **MCC comprehension** | 68 | Operate: Home/Clients/CTP/Content/Opportunities/Pipeline/Factory (S, R unauth→login) | Build 11 peers; `readOperatingMode` unused (S); command registry wider than sidebar (S) |
| **Premium experience** | 72 | Public Client Portal + Master Portal login composition Verified (R25–R26) | Auth Journey/Guide polish **Blocked**; dual Help floats risk cheap overlap (S) |
| **Role relevance** | 70 | CX shell only when CTP-bound (S); module `requiredRole` matrix (S) | Executive dual surfaces still routable for CX clients at SHA—no soft-redirect (S); live entitlements **Blocked** |
| **Navigation clarity** | 55 | Five explicit CX destinations (S); Operate short list (S) | No primary/secondary hierarchy in CX chrome at SHA (S); Progress ≠ “project home” language (S) |
| **Contextual help** | 48 | Assistant mounted on portal layout; FAQ content exists (S) | Four competing help concepts (S); FAQ contradicts nav (S §6.2); no portal confusion auto-open (S); drawer/assistant coexistence **Blocked** at runtime |
| **Mobile design** | 52 | Public login usable in narrow composition (R Partial) | Authenticated 390×844 CX **Blocked**; predicted dual FAB collision untested (B) |
| **Accessibility** | 58 | Login fields labeled; admin/portal headings clear (R); FAQ dialog role in source (S) | Keyboard/focus for dual drawers + Journey scenes **Blocked**; CX `aria-label="Client experience"` only (S) |

---

## 3. Structural causes of confusion

Ordered by launch impact (client first, then MCC).

### C1 — Competing homes (Client)

| | |
|---|---|
| **Cause** | `buildClientExperienceNav` places **Your Journey** first; Guide HQ is **Progress** (`designStudioPath` → `/ctp/progress`). `ClientExperienceNav` renders all five as equal `cex-shell-link` (Pass 1 §3.1). |
| **Client mental model break** | Returning clients need status / next action / upload / message—not a seven-scene story as the first menu idea. |
| **Evidence** | Pass 1 §3.1, §7, B2; runtime R13–R14 **Blocked** (structure still binds production product code). |

### C2 — Help fragmentation (Client)

| | |
|---|---|
| **Cause** | Nav **Support** + nav **Messages** (shared `buildCtpSupportView`) + FAQ FAB (`PortalCtpHelpDrawer`) + layout **EA Assistant** trigger labeled **Help**. |
| **Client mental model break** | “Where do I ask a question?” has no single answer. |
| **Evidence** | Pass 1 §6, B3; R15–R16 **Blocked**. |

### C3 — FAQ / product language drift (Client)

| | |
|---|---|
| **Cause** | FAQ cites **Overview**, **Scheduling**, **Messages & Support**, Design Studio **under Progress** while menu is Journey / Progress / Documents / Messages / Support and `/ctp/schedule` redirects to review. |
| **Client mental model break** | Help text increases search cost and erodes trust. |
| **Evidence** | Pass 1 §6.2, B4 (`lib/ctp-faq.ts` @ SHA). |

### C4 — Build cafeteria (MCC)

| | |
|---|---|
| **Cause** | `BUILDER_NAV` exposes 11 equal destinations; Operate/Build mode API is dead; both groups always render. |
| **Operator mental model break** | Factory tools look like peer “daily work” destinations beside Clients/CTP. |
| **Evidence** | Pass 1 §3.4, B6; R20–R21 **Blocked** (structure still clear). |

### C5 — Dual product surfaces without CX soft-redirect (Client @ SHA)

| | |
|---|---|
| **Cause** | Executive `/documents`, `/messaging`, `/ask`, etc. remain live; soft-redirect helper **absent** at `545c6251`. |
| **Client mental model break** | Bookmarks/emails/deep links can land in executive chrome that CX clients were not meant to operate. |
| **Evidence** | Pass 1 §7, B7; R18 **Blocked**. |

### C6 — Verification gap masquerading as quality (Program)

| | |
|---|---|
| **Cause** | Cert tenant stopped at portal 2FA (R29 Verified → R30 Failed). |
| **Risk** | Shipping narrative “premium CX” without authenticated proof. |
| **Evidence** | Pass 1 §8.2 F, B1, B10. |

---

## 4. Area evaluations

### 4.1 Client comprehension — **58**

**Strengths (S/R):**  
Private CTP workspace concept is real; Documents is clear; Guide route exists; public login messaging names “CTP workspace” (R7/R25).

**Confusion (S):**  
Journey-first nav; Progress label; Messages vs Support twin; FAQ mismatches.

**Blocked (B):**  
Whether Progress actually presents a single clear NBA in session; whether Journey feels “too heavy” in practice—structure predicts yes, runtime not observed.

### 4.2 MCC comprehension — **68**

**Strengths (S/R):**  
Operate list matches launch intent (Pass 1 §3.4); unauth destinations correctly gate to admin login (R10–R11)—not 404 chaos.

**Confusion (S):**  
Build flatness; Navigator/⌘K/Voice/Tour as parallel “how do I…” systems (Pass 1 §6 admin rows); `/api/admin/command-bar` missing → fallback risk (B8).

**Blocked (B):**  
Visual hierarchy of live sidebar, command-bar index quality (R20–R24).

### 4.3 Premium experience — **72**

**Strengths (R):**  
Client and admin login pages read intentional, branded, calm (R25–R26).

**Risks (S + B):**  
Premium components exist (Journey, Guide, Assistant), but competing chrome can feel noisy. Auth premium path **Blocked**—score capped.

### 4.4 Role relevance — **70**

**Strengths (S):**  
CX shell gated by CTP submission binding; module roles documented; admin `admin:access` vs portal sessions separated.

**Gaps (S + B):**  
At SHA, CX clients can still hit executive routes; live entitlement filtering **Blocked**.

### 4.5 Navigation clarity — **55**

Lowest client-facing clarity driver after help. Five equal primaries with Journey first is the core defect. Operate clarity is high; overall pulled down by CX + Build.

### 4.6 Contextual help — **48**

Lowest score. Capability exists (Assistant + FAQ + Support), but **clarity fails**. No portal-wide confusion triggers (Pass 1 §6.1). Discovery-oriented `applyDiscoverSignal` does not satisfy portal requirement.

### 4.7 Mobile design — **52**

Public login Partial only. Authenticated mobile (dual FAB, nav wrap, Journey scenes) **Blocked**—do not claim mobile-ready CX.

### 4.8 Accessibility — **58**

Login labeling Verified. Drawer `role="dialog"` / Escape handling exist in source for FAQ. Full CX keyboard, focus restore, and dual-overlay a11y **Blocked**.

---

## 5. Simplest target experience (recommendation only — do not implement)

Launch impact: reduce client confusion and MCC noise without redesigning architecture—reuse Portal Chassis, Trust later, CTP Guide home, Operate nav.

### 5.1 Client primary navigation (target)

**Canonical (corrected):** **Your Project → Documents → Contact → Help** (Journey quiet / secondary).

| Priority | Label | Route | Notes |
|---|---|---|---|
| Primary home | **Your Project** | `/portal/{slug}/ctp/progress` | Rename Progress; make first/default |
| Primary | **Documents** | `/ctp/documents` | Keep |
| Primary | **Contact** | `/ctp/messages` | Human channel (not “Messages”) |
| Primary | **Help** | `/ctp/support` + unified control (§5.2) | Self-serve answers; not a twin of Contact |
| Secondary | **Journey** | `/ctp` | Quiet / account-adjacent—not equal primary |
| Account | **Log out** | `/api/portal/logout` | Keep |

**Correction note (2026-07-23):** Earlier draft allowed “Messages *or* Contact” and listed Messages before Documents in §5.3. Locked to **Contact** and order **Your Project / Documents / Contact / Help**. See `docs/audits/EA-EXPERIENCE-AUDIT-IMPLEMENTATION-GAP.md`.

**Remove as separate primary:** Support-as-peer-of-Messages labels (fold twin naming into **Contact** + **Help**).

### 5.2 Unified Help (target)

One persistent control (prefer **EA Assistant**):

- What this page is for  
- What to do next (NBA from Guide)  
- Page Q&A  
- Short walkthrough  
- Searchable FAQ (rewrite to match nav)  
- Message your team → Contact  
- Report a problem → Contact / tracked request  

FAQ FAB becomes content inside Assistant—not a second float.  
Proactive open only on meaningful signals (repeat errors, failed upload, inactivity on required action)—**not** on every page load.

### 5.3 FAQ truthfulness (target)

Rewrite so every direction names **Your Project / Documents / Contact / Help / Journey** only. Remove Overview, Scheduling-as-nav, and “Messages & Support” as if one item.

### 5.4 MCC (target)

- Keep **Operate** seven as-is.  
- Nest Repositories, Project Generator, Skin Factory, Codex Builder, Chassis Deploy, Protocols (if redundant), Blueprints, Launches **under EA Factory** (or role-gate).  
- Wire or delete dead `readOperatingMode`—do not leave both groups as false “modes.”

### 5.5 Dual surfaces (target)

At SHA there is no soft-redirect: add CX soft-redirects (or equivalent) so executive dual URLs land on CX destinations—**after** auth verification, as a controlled change.

### 5.6 Verification before calling CX “done”

Unlock Pass 1 R30 (2FA code, admin enter, or production HMAC secret), then re-run R13–R18, R28 only. Do not implement Pass 2 recommendations until that evidence exists **or** product owner accepts structure-only risk.

---

## 6. What not to do

- Do not rebuild Portal Chassis / CX as a new app.  
- Do not reopen Experience Director v1.  
- Do not treat dirty-worktree nav/FAQ rewrites as shipped at `545c6251`.  
- Do not score authenticated mobile/help as Verified.  
- Do not expand Build with more peer top-level tools.

---

## 7. Confidence & residual risk

| Claim type | Confidence |
|---|---|
| Structural confusion (C1–C5) | **High** (Pass 1 source registries) |
| Public premium login | **High** (runtime Verified) |
| Auth CX feels confusing in session | **Medium** (inferred; runtime Blocked) |
| Dual FAB mobile collision | **Medium-low** (predicted; Blocked) |
| Overall 61 | **Medium-high** for structure; **low** for end-to-end CX certification |

Residual program risk: **B1 / B10** — without an authenticated session, launch claims about client Journey/Help remain unproven.

---

## 8. Sign-off

| Item | Value |
|---|---|
| Pass 2 complete | **Yes** (evaluation + target experience only) |
| Report path | `docs/audits/EA-EXPERIENCE-AUDIT-PASS-2.md` |
| Implementation | **Not started** |
| Code modified | **None** |
| Depends on | Pass 1 complete; auth CX still Blocked/Failed for session-dependent claims |

*End of Pass 2.*
