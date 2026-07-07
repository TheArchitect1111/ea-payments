# Experience Builder P0 Stabilization Report

**Date:** 2026-07-07  
**Branch:** `feat/experience-builder-p0`  
**Verdict:** **GO for RC1 user testing (local)** — staging deploy required for hosted validation

---

## P0 checklist

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P0-1 | Deploy routes to staging | **PENDING DEPLOY** | Code committed to branch; production still 404 until merge + deploy |
| P0-2 | Fix B1 (published status) | **PASS** | `PUT` preserves `existing.status` |
| P0-3 | Configure dev environment | **PASS** | Local demo fallback + env docs + global persistence store |
| P0-4 | Full validation | **PASS** | `scripts/validate-experience-builder-rc1.mjs` — 12/12 steps |

---

## Validation results (local `http://localhost:3458`)

```
✓ 0-login
✓ 0b-portal-route (200)
✓ 1-create
✓ 2-save-draft
✓ 3-4-reload-persist
✓ 5-preview
✓ 6-publish (manual)
✓ 7-published-render
✓ 8-edit-published (status preserved — B1 fixed)
✓ 9-republish
✓ 10-changes-visible
✓ editor-route (200)

pass: true
pageId: exp-1783433477733-v3g9jd
previewPath: /preview/experience/demo-client/exp-1783433477733-v3g9jd
```

---

## Files changed

| File | Change |
|------|--------|
| `app/api/portal/experience-pages/**` | Experience Builder API routes |
| `app/portal/[slug]/experience-builder/**` | List + Puck editor UI |
| `app/preview/experience/**` | Public preview render |
| `lib/experience-builder/**` | Puck config, store, publish |
| `lib/demo-local-fallback.ts` | **New** — local dev auth without Airtable |
| `lib/airtable.ts` | Local demo login + client lookup fallback |
| `lib/demo-client.ts` | `ensureDemoClient` ok in local fallback mode |
| `lib/ea-portal-auth.ts` | Local dev session signing when `SESSION_SECRET` empty |
| `lib/creative-studio/persistence.ts` | `experience` record type + `globalThis` memory store |
| `app/api/portal/experience-pages/[pageId]/route.ts` | **B1 fix** — preserve status on save |
| `package.json` / `package-lock.json` | `@measured/puck` dependency |
| `scripts/validate-experience-builder-rc1.mjs` | Demo session fallback + B1 assertion |
| `docs/EXPERIENCE-BUILDER-ENV.md` | **New** — required env vars |
| `docs/PUCK-INTEGRATION-REPORT.md` | Integration reference |

---

## Screenshots

| File | Description |
|------|-------------|
| `p0-preview-desktop.png` | Published preview — desktop (hero + republish check block) |
| `p0-preview-mobile.png` | Same page — mobile viewport (390×844) |

---

## Remaining blockers (non-P0)

| ID | Severity | Issue |
|----|----------|-------|
| B2 | Medium | Preview route is public (draft URL leak) |
| B3 | Medium | No portal nav link to Experience Builder |
| B4 | Medium | Create button silent on failure |
| B5 | Low | Auto-save without debounce |

**Deploy blocker:** Merge `feat/experience-builder-p0` and redeploy Vercel staging/production so hosted routes return 200.

---

## Go / No-Go

| Gate | Result |
|------|--------|
| No 404 routes (local) | **GO** |
| Local authentication | **GO** |
| Published stays published after edit | **GO** |
| Full validation script | **GO** |
| Hosted staging deploy | **NO-GO until merge** |

**Recommendation:** Merge and deploy `feat/experience-builder-p0`, then re-run:

```bash
node scripts/validate-experience-builder-rc1.mjs https://ea-payments.vercel.app
```

After hosted validation passes → **GO for RC1 user testing**.
