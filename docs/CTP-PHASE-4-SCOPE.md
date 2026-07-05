# CTP Phase 4 — Scoped Work Packages

**Status:** Scoped July 2026 (post PR #52 / Phase 3 complete)  
**Prerequisite:** Phases 1–3 merged — full CTP lifecycle through admin asset viewer  
**Protocol:** EA Autonomous Architecture & Implementation Protocol

---

## Executive summary

Phase 4 extends **prospect visibility** and **EA scheduling control** — assets on the portal, collaborative review datetime on the admin side.

| Order | Package | Summary |
|-------|---------|---------|
| 1 | **CTP-4B** Portal asset gallery | Prospects see uploaded discovery files on `/portal/[slug]/ctp` |
| 2 | **CTP-4C** Review scheduling | Admin sets review datetime → status + Pulse |

---

## CTP-4B — Portal asset gallery

**Goal:** Authenticated portal users see discovery uploads linked to their CTP submission.

| Layer | Work |
|-------|------|
| View | Extend `buildCtpPortalStatusView()` with `assets[]` |
| UI | Gallery section on `app/portal/[slug]/ctp/page.tsx` |
| API | Include assets in `GET /api/portal/ctp` response |

### Acceptance criteria

- [ ] Portal CTP page shows logo/photo thumbnails when manifest exists
- [ ] Empty manifest → section hidden
- [ ] Asset links use `/api/ctp/assets/{id}`

---

## CTP-4C — Review scheduling

**Goal:** EA admin schedules collaborative review; CTP row and portal timeline update.

| Layer | Work |
|-------|------|
| Bridge | `lib/ctp-review-schedule.ts` — `scheduleCtpReview()` |
| API | `POST /api/admin/ctp/submissions/[id]/schedule-review` |
| Admin UI | Datetime picker on `/admin/ctp` expanded submission |
| Pulse | `ctp.review.scheduled` |

### Acceptance criteria

- [ ] Admin schedules review → `Review Scheduled At` + status `Review Scheduled`
- [ ] Pulse emits `ctp.review.scheduled`
- [ ] Portal timeline shows scheduled datetime

---

## Suggested PR

| PR | Title |
|----|-------|
| #53 | `feat(ctp): portal asset gallery + review scheduling` |
