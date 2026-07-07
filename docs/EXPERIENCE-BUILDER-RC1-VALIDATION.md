# Experience Builder RC1 Validation Report

**Date:** 2026-07-07  
**Scope:** Validation only — no features, redesign, or package installs  
**Repo:** `ea-payments` @ local dev (`http://localhost:3456`) + production (`https://ea-payments.vercel.app`)  
**Validator:** EA audit sprint (automated script + code review + browser smoke)

---

## Executive summary

**RC1 verdict: NOT READY to expand.**

The Experience Builder implementation compiles and the API/UI routes exist in source, but **end-to-end validation could not be completed** because:

1. **Production** — Experience Builder routes are **not deployed** (404 on list, editor, and create API).
2. **Local** — Portal demo login fails with **"Not configured."** (`AIRTABLE_API_KEY` missing), blocking authenticated UI and API flows.

Until the feature is deployed and a configured environment is available, steps 1–12 remain **unverified at runtime**. Code review identified **one high-severity bug** (published → draft regression on save) and several medium issues that should be fixed before expansion.

---

## Validation environment

| Target | Login | Experience Builder routes | Notes |
|--------|-------|---------------------------|-------|
| `localhost:3456` | FAIL — "Not configured." | Redirect to login (unauthenticated) | Dev server running; no Airtable |
| `ea-payments.vercel.app` | PASS (demo credentials) | **404** — not deployed | `scripts/validate-experience-builder-rc1.mjs` confirms |

**Script run (production):**

```
✓ 0-login
✗ 0b-portal-route (404)
✗ 1-create (failed — routes absent)
```

---

## Checklist (steps 1–12)

| # | Step | Result | Evidence |
|---|------|--------|----------|
| 1 | Create a new page | **BLOCKED** | API `POST /api/portal/experience-pages` unreachable on prod (404). Local auth blocked. |
| 2 | Save a draft | **NOT RUN** | `ExperienceBuilderEditor` calls PUT on every Puck `onChange` (code review). |
| 3 | Reload the page | **NOT RUN** | Editor loads page server-side via `getExperiencePage` (code review). |
| 4 | Confirm draft persists | **NOT RUN** | Persistence via `lib/creative-studio/persistence.ts` (memory + Airtable). |
| 5 | Preview the page | **NOT RUN** | Public route `/preview/experience/{slug}/{pageId}` exists (code review). |
| 6 | Publish the page | **NOT RUN** | `POST .../publish` → `publishExperiencePage` → `publishCommunication({ channel: 'website' })`. |
| 7 | Confirm published page renders | **NOT RUN** | Preview renders `page.puckData` regardless of `status` (no published-only gate). |
| 8 | Edit the published page | **NOT RUN** | PUT allowed; **bug: forces `status: 'draft'`** (see B1). |
| 9 | Republish | **NOT RUN** | Republish endpoint reuses publish flow (code review). |
| 10 | Verify changes appear | **NOT RUN** | Preview reads latest stored puckData (code review). |
| 11 | Test desktop | **NOT RUN** | Could not reach editor UI. |
| 12 | Test mobile | **NOT RUN** | Block CSS uses `clamp()` / `auto-fit` grids; Puck editor mobile untested. |

---

## Feature review (code-level)

### Block editing

- **5 Puck blocks:** `EAHero`, `EATextSection`, `EAFeatures`, `EAMetrics`, `EACtaBand`
- Grouped into Layout / Content categories
- Default props and EA token styling (`--ea-navy`, `--ea-gold`, `--ea-cream`)
- **Assessment:** Structure is sound for RC1; runtime drag/edit not verified.

### Auto-save

- `onChange` triggers immediate `PUT` with no debounce
- Status text: "Saving…" / "Saved" / error string in header
- **Risk:** Race conditions, excessive API calls, last-write-wins on fast edits (B5)

### Preview

- Opens in new tab from editor header and list
- **No authentication** — anyone with `pageId` can view draft content (B2)
- `robots: noindex` set on preview page metadata

### Publish

- Uses existing `publishCommunication` pipeline
- `website` channel resolves to **`manual` mode** — marks ready, does not deploy to live site (B7)
- Activity event `experience-builder.publish` emitted on success
- List shows `draft` / `published` badge

### Error handling

- Save/publish: inline status message in editor header
- Create (index): **silent failure** — no user-visible error if POST fails (B4)
- API: consistent `{ ok, error }` JSON responses

### Empty states

- Index: "No experiences yet. Create your first page to open the Puck editor."
- **Assessment:** Adequate for RC1.

### Accessibility

- Blocks use semantic headings (`h1`, `h2`), `section`, `article`
- Login error exposed as `role="alert"` ("Not configured.")
- Editor is full-screen Puck (no `PortalShell`); Puck a11y depends on third-party UI
- **Observed:** React hydration warning on local login page (separate issue, B10)

### Performance

- Auto-save per keystroke is the main concern (B5)
- Preview/editor are client-heavy (Puck); no lazy-load beyond Next defaults
- In-memory persistence is fast but non-durable without Airtable (B6)

---

## Screenshots

Captured during validation (local):

| File | Description |
|------|-------------|
| `rc1-local-login-blocked.png` | Portal login — demo sign-in blocked |
| Browser session captures | Login page, "Not configured." alert after demo sign-in attempt |
| Production login redirect | Navigating to `/portal/demo-client/experience-builder` on prod → login with `next=` param (feature absent post-login) |

*Screenshot files saved under Cursor screenshots temp directory during browser session.*

---

## Bugs

| ID | Severity | Area | Description |
|----|----------|------|-------------|
| **B0** | **Blocker** | Deployment | Experience Builder not on production (`404` on routes/API). |
| **B0b** | **Blocker** | Local env | `AIRTABLE_API_KEY` not configured — demo login and `requirePortalModule` client lookup fail locally. |
| **B1** | **High** | API | `PUT /api/portal/experience-pages/[pageId]` always sets `status: 'draft'`, reverting published pages on any edit/save. |
| **B2** | **Medium** | Preview | `/preview/experience/{slug}/{pageId}` is public; draft content leakable via URL. |
| **B3** | **Medium** | Navigation | No portal nav link to `/experience-builder`; only direct URL. |
| **B4** | **Medium** | UX | `ExperienceBuilderIndex.createPage()` shows no error when create fails. |
| **B5** | **Low** | Performance | Auto-save on every `onChange` without debounce. |
| **B6** | **Low** | Persistence | In-memory store lost on server restart when Airtable unavailable. |
| **B7** | **Info** | Publish | `website` channel is `manual` — no live site deployment (expected for RC1). |
| **B8** | **Info** | UX | Editor route has no `PortalShell` (intentional full-screen Puck). |
| **B9** | **Info** | Access | `landing` module `requiredRole: 'admin'` — non-admin portal users cannot access. |
| **B10** | **Low** | Login | React hydration error on local `/portal/login` (MagicLinkForm / PortalLoginPage). |

### B1 detail (recommended fix before expansion)

In `app/api/portal/experience-pages/[pageId]/route.ts`, the PUT handler hard-codes:

```ts
status: 'draft',
```

**Recommended fix:** Preserve `existing.status` unless explicitly changing lifecycle (e.g. only set `draft` on first save from editor, or add `unpublish` action).

---

## Blockers (must resolve before expanding)

1. **Deploy Experience Builder** to production (or designated RC1 staging) so routes and API exist.
2. **Configure local/staging Airtable** (or document approved dev bypass) so demo login and portal module gates work for QA.
3. **Fix B1** — published status regression on save.
4. **Complete E2E re-run** of `scripts/validate-experience-builder-rc1.mjs` after deploy + env fix.

---

## Recommended fixes (priority order)

| Priority | Fix | Effort |
|----------|-----|--------|
| P0 | Deploy current branch with Experience Builder routes | Ops |
| P0 | Fix B1 — preserve publish status on content-only saves | Small |
| P1 | Gate draft preview behind portal auth or signed preview tokens (B2) | Medium |
| P1 | Add portal nav entry under Landing Pages module (B3) | Small |
| P1 | Surface create errors in index UI (B4) | Small |
| P2 | Debounce auto-save (~500–1000ms) (B5) | Small |
| P2 | Investigate login hydration warning (B10) | Small |
| P3 | Document `admin`-only access and manual publish semantics for RC1 | Docs |

---

## Re-validation procedure

After deploy and env configuration:

```bash
# HTTP flow (12 steps)
node scripts/validate-experience-builder-rc1.mjs https://<staging-or-prod>

# Manual UI
# 1. /portal/demo-client/experience-builder
# 2. Create → edit blocks → confirm auto-save
# 3. Preview (desktop + mobile viewport)
# 4. Publish → republish after edit
# 5. Confirm list status badges and preview content
```

---

## Sign-off

| Gate | Status |
|------|--------|
| Build compiles | PASS (prior `npm run build`) |
| Routes present in source | PASS |
| E2E flow validated | **FAIL** (environment) |
| Security review (preview) | **CONCERNS** (B2) |
| Ready to expand | **NO** |
