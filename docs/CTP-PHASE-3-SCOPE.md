# CTP Phase 3 — Scoped Work Packages

**Status:** Scoped July 2026 (post PR #50 / Phase 2 complete)  
**Prerequisite:** Phase 2 merged — intake agent, workspace provision, portal status, studio bridge, asset upload  
**Protocol:** EA Autonomous Architecture & Implementation Protocol  
**Guardrail:** Extend the chassis; do not fork parallel CTP systems.

---

## Executive summary

Phase 2 completed the **lifecycle spine** — submit → intake → workspace → studio campaign → asset upload.

Phase 3 closes the **studio loop** — brand assets flow into Creative Studio, campaigns reach review-ready state automatically, and admins can inspect uploaded discovery files.

### Recommended build order

| Order | Package | Why first |
|-------|---------|-----------|
| 1 | **CTP-3A** Logo → brand profile bridge | Unblocks on-brand campaign generation; deferred from 2E |
| 2 | **CTP-3B** Studio ready-for-review automation | Completes status machine; enables attention stats |
| 3 | **CTP-3C** Admin asset viewer | Ops visibility; reads existing manifest |

---

## Shared contracts (all packages)

### Data owner

`lib/ctp-submissions.ts` remains the single CTP store. Phase 3 reads:

- `assetManifest` — uploaded discovery files (`logo`, `photos`, …)
- `discoveryAnswers` — brand feel, org name (optional enrichments)
- `creativeCampaignId`, `studioStatus` — studio lifecycle

Creative Studio brand profiles (`lib/creative-studio/brand-store.ts`) are the target for logo sync.

### New Pulse events

| Event | When | Consumers |
|-------|------|-----------|
| `ctp.studio.ready` | Campaign assets complete / ready for review | Mission Control, attention stats |

### Status machine (Phase 3 additions)

```
Studio In Progress
  → Ready For Review   (auto when campaign completionPercent === 100)
```

---

## CTP-3A — Logo → brand profile bridge

**Goal:** When a CTP studio campaign is created, apply the uploaded logo (and org name) to the tenant Creative Studio brand profile before asset generation.

### Implementation

| Layer | Work |
|-------|------|
| Bridge | `lib/ctp-brand-bridge.ts` — `applyCtpBrandFromSubmission()` |
| Hook | Call from `runCtpStudioCampaign()` before `createCampaign()` |
| URL | Resolve relative `/api/ctp/assets/{id}` to absolute app URL for `logoUrl` |

### Acceptance criteria

- [x] CTP submission with `assetManifest.logo` → brand profile `logoUrl` set for org
- [x] `organizationName` on brand profile uses submission `businessName` when logo applied
- [x] Campaign generation runs after brand sync (logo available to package)
- [x] No logo in manifest → brand profile unchanged (except org name optional skip)

### Effort

**S** (1–2 days)

---

## CTP-3B — Studio ready-for-review automation

**Goal:** Advance CTP submission to `Ready For Review` when the auto-generated campaign package is complete.

### Implementation

| Layer | Work |
|-------|------|
| Bridge | Extend `runCtpStudioCampaign()` — after `createCampaign()`, if `completionPercent === 100` |
| Store | `updateCtpSubmission()` → `studioStatus: 'Ready For Review'`, `status: 'Ready For Review'` |
| Pulse | Emit `ctp.studio.ready` |

### Acceptance criteria

- [x] After studio campaign creation, CTP row shows `Ready For Review` when package is complete
- [x] Pulse shows `ctp.studio.ready`
- [x] Mission Control CTP attention includes ready-for-review count
- [x] Partial campaigns (future) stay `In Progress`

### Effort

**S** (1 day)

---

## CTP-3C — Admin asset viewer

**Goal:** EA team can view discovery uploads from admin without opening Airtable JSON.

### Implementation sketch

| Layer | Work |
|-------|------|
| Admin | Link manifest assets on proposals/CTP admin detail |
| API | Reuse `GET /api/ctp/assets/{id}` |

### Acceptance criteria

- [x] Admin can open uploaded logo/photos from CTP submission detail
- [x] Manifest empty state handled gracefully

### Effort

**M** (2–3 days)

---

## Suggested PR breakdown

| PR | Package | Title |
|----|---------|-------|
| #51 | 3A + 3B | `feat(ctp): brand profile bridge + studio ready automation` |
| #52 | 3C | `feat(ctp): admin asset viewer` |

---

## Ten-year check

| Question | Phase 3 answer |
|----------|----------------|
| Single store? | Yes — brand bridge reads CTP row; writes Creative Studio brand record |
| Pulse-native? | `ctp.studio.ready` on review-ready transition |
| Portal chassis? | Portal status page already reads `studioStatus` |
| Factory alignment? | `ea-ctp` protocol version bump per package |
