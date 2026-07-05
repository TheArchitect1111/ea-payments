# CTP Phase 2 — Scoped Work Packages

**Status:** Scoped July 2026 (post PR #44)  
**Prerequisite:** Phase 1 merged — `CTP Submissions` table, `ctp.submitted` Pulse event, extended assessment submit  
**Protocol:** EA Autonomous Architecture & Implementation Protocol  
**Guardrail:** Extend the chassis; do not fork parallel CTP systems.

---

## Executive summary

Phase 1 wired the **spine**: discovery answers persist, Pulse fires, Mission Control attention counts are real, Factory knows `ea-ctp`.

Phase 2 completes the **lifecycle** — from submission through workspace, studio, review, and assets — using existing EA patterns (`requirePortalModule`, `createPortalAccess`, Creative Studio store, intake agent, media library).

### Recommended build order

| Order | Package | Why first |
|-------|---------|-----------|
| 1 | **CTP-2D** Intake agent orchestration | Unblocks EA team before automation; no infra deps |
| 2 | **CTP-2B** Workspace auto-provision | Unblocks portal status + studio work |
| 3 | **CTP-2A** Portal CTP status page | Prospect-facing value; reads same store |
| 4 | **CTP-2C** Creative Studio auto-campaign | Depends on org/slug + studio table |
| 5 | **CTP-2E** Binary asset upload | Largest surface; benefits from CTP record + media library |

---

## Shared contracts (all packages)

### Data owner

`lib/ctp-submissions.ts` remains the **single source of truth** for CTP lifecycle. Phase 2 adds:

- `updateCtpSubmission(id, patch)` — status transitions with `Updated At`
- Optional new Airtable fields (add via schema check + meta setup):
  - `Portal Slug` — linked workspace
  - `Creative Campaign ID` — linked studio campaign
  - `Intake Analysis JSON` — structured intake agent output
  - `Asset Manifest JSON` — uploaded file references

### New Pulse events (proposed)

| Event | When | Consumers |
|-------|------|-------------|
| `ctp.workspace.provisioning` | Provision started | Mission Control, Opportunity Graph |
| `ctp.workspace.active` | Portal live | Portal module, attention stats |
| `ctp.workspace.failed` | Provision error | Mission Control (critical) |
| `ctp.studio.started` | Campaign created | Creative Studio admin |
| `ctp.studio.ready` | All assets ready for review | `pulse-attention` (already templated) |
| `ctp.review.scheduled` | Review datetime set | Events hub, email |
| `ctp.intake.analyzed` | Intake agent complete | Proposals admin, ActivityEvents |

### Status machine (canonical)

```
Submitted
  → Workspace Pending → Workspace Active (or Failed)
  → Studio In Progress → Ready For Review
  → Review Scheduled → Completed
```

Phase 2 code must transition via `updateCtpSubmission()` only — no ad-hoc Airtable writes.

---

## CTP-2A — Portal CTP status module

**Goal:** Prospects with an active portal see CTP progress without email ping-pong.

### Where it belongs

- **New portal module** `ctp` (preferred) OR extend existing `discovery` module with a post-submit “status” view.
- Recommendation: **new module `ctp`** — discovery module today routes to `/assessment`; CTP status is post-intake lifecycle, different audience moment.

### Implementation sketch

| Layer | Work |
|-------|------|
| Registry | Add `'ctp'` to `MODULE_IDS` + `MODULE_REGISTRY` (operations group, `pathSegment: 'ctp'`) |
| Page | `app/portal/[slug]/ctp/page.tsx` — `requirePortalModule(slug, 'ctp')` + `PortalSubpage` |
| API | `GET /api/portal/ctp` — `portalTenant()`, lookup by email or `Portal Slug` on CTP row |
| UI | Timeline: Submitted → Workspace → Studio → Review; links to proposal if `proposalId` |
| Entitlements | Grant `ctp` on packages that include discovery/blueprint (`PACKAGE_MODULE_GRANTS`) |

### Reuse

- `PortalSubpage`, design tokens, `portalTenant()` guard pattern from Phase 2 portal hardening
- `getCtpSubmissionById` / list filtered by email + portal slug

### Acceptance criteria

- [ ] Authenticated portal user sees their CTP submission status
- [ ] Status reflects Airtable within 60s (no stale memory-only state in prod)
- [ ] Module hidden when no CTP row exists for tenant
- [ ] `requirePortalModule` enforced on page + API

### Effort

**M** (3–5 days) — registry + page + API + entitlements

### Out of scope

- Editing discovery answers from portal (admin/reattempt only)
- Payment or proposal checkout from this page

---

## CTP-2B — Workspace auto-provision

**Goal:** When discovery indicates portal need (`portalRequired` / team size heuristic), open a workspace automatically after CTP submit.

### Where it belongs

- **Async hook** after `createCtpSubmission()` in assessment submit — same pattern as Stripe `provisionConnectAfterCheckout`
- New: `lib/ctp-workspace-provision.ts` (thin orchestrator, not inline in route)

### Implementation sketch

```
ctp.submitted
  → if workspaceStatus === 'Pending'
  → updateCtpSubmission({ workspaceStatus: 'Provisioning' })
  → emit ctp.workspace.provisioning
  → createPortalAccess({ clientName, email, organization })
  → on success: patch Portal Slug, workspaceStatus Active, status Workspace Active
  → emit ctp.workspace.active
  → on failure: workspaceStatus Failed, emit ctp.workspace.failed
```

### Reuse

- `lib/portal-access.ts` — `createPortalAccess()` (slug, temp password, Airtable client row)
- `derivePortalRequired()` logic already in assessment submit
- Connect provision pattern in `lib/connect-provision-hook.ts` as reference for idempotency + logging

### Security

- Idempotency key: `submission.id` — never double-provision
- Rate limit: max 1 provision attempt per submission; manual retry via admin action
- Do **not** auto-provision without explicit discovery signal (team size / portal flag)

### Acceptance criteria

- [ ] Large-team CTP submit → portal slug created + credentials emailed
- [ ] CTP row updated with `Portal Slug` and `Workspace Status: Active`
- [ ] Failed provision surfaces in Mission Control (`ctpWorkspacesPending` / failed item)
- [ ] Re-submit same email does not create duplicate portals (idempotent)

### Effort

**L** (5–8 days) — async job, idempotency, admin retry, email verification

### Dependencies

- `createPortalAccess` stable in production Airtable
- Optional: queue (Vercel background / Make webhook) if submit latency exceeds 10s

---

## CTP-2C — Creative Studio auto-campaign

**Goal:** Each CTP submission spawns a **design studio campaign** EA can refine before collaborative review.

### Where it belongs

- Trigger after workspace active OR immediately for non-portal submissions (config flag)
- `lib/ctp-studio-bridge.ts` calling existing `createCampaign()` from `lib/creative-studio/campaign-store.ts`

### Implementation sketch

```
Inputs from CTP Payload JSON:
  - businessName, discoveryAnswers, desiredExperiences, recommendations
  → build story string (template, not LLM — intake agent already synthesizes)
  → goalId: map desiredExperiences to CampaignGoalId (fallback: 'brand-awareness')
  → createCampaign({ story, goalId, organizationId: portal org or EA internal })
  → patch CTP: Studio Status In Progress, Creative Campaign ID
  → emit ctp.studio.started
```

### Admin UX

- Mission Control attention item links to `/admin/creative-studio/campaigns/{id}` (update `pulse-attention.ts` href when campaign ID known)
- Manual “Create studio from CTP” button on proposals admin as fallback

### Reuse

- Creative Studio persistence (`lib/creative-studio/persistence.ts`)
- Brand profile + media library for asset generation
- `extractCampaignBrief` / `generateCampaignPackage` pipeline

### Acceptance criteria

- [ ] CTP row stores `Creative Campaign ID`
- [ ] Campaign brief references business name + top discovery themes
- [ ] Studio status advances to `Ready For Review` when campaign publish checklist complete (hook TBD or manual admin toggle in 2C v1)
- [ ] No duplicate campaigns on webhook retry

### Effort

**M** (4–6 days)

### Dependencies

- **CTP-2D** recommended first (richer story input from intake analysis)
- Creative Studio Airtable table provisioned (`schema.creativeStudio.ok`)

---

## CTP-2D — Intake agent post-submit orchestration

**Goal:** Automatically run the **intake agent** after CTP submit so EA receives an executive summary, proposal angles, and risks — not raw JSON.

### Where it belongs

- Fire-and-forget after `createCtpSubmission()` succeeds
- `lib/ctp-intake-orchestrator.ts` dispatching `intakeAgent.execute()` via existing orchestrator or direct call

### Implementation sketch

```
POST assessment/submit (CTP path)
  → createCtpSubmission(...)
  → emit ctp.submitted
  → void runCtpIntakeAnalysis({ submissionId, discoveryAnswers, desiredExperiences, assessmentId })
       → intakeAgent.execute({ intent: 'ctp submission', query: ..., context: { submissionId, ... } })
       → store Intake Analysis JSON on CTP row
       → emit ctp.intake.analyzed
       → optional: append summary to Proposals admin notes via Airtable
```

### Reuse

- `lib/agents/intake-agent.ts` — already lists `ctp submission` capability
- `lib/agents/orchestrator.ts` — `logAIEvent`, agent selection
- AI Gateway + `OPENAI_API_KEY` health (agent already reports degraded without key)

### Acceptance criteria

- [ ] Within 2 min of submit, CTP row contains `Intake Analysis JSON`
- [ ] Pulse / ActivityEvents show `ctp.intake.analyzed`
- [ ] Failure does not block submit response (async, logged)
- [ ] Admin can re-run analysis from Mission Control or proposals view

### Effort

**S** (2–3 days) — lowest risk, highest immediate EA value

### Dependencies

- `OPENAI_API_KEY` in Vercel production

---

## CTP-2E — Binary asset upload (discovery `asset-select`)

**Goal:** Replace `noopFile` file inputs in Discover wizard with real uploads tied to the CTP submission.

### Current gap

`app/discover/page.tsx` renders file inputs for `asset-select` choices but `onChange={noopFile}` — files are discarded.

### Where it belongs

- Upload API: `POST /api/ctp/assets` (public, rate-limited, tied to session or submission draft token)
- Storage: reuse Creative Studio **media library** pattern (`lib/creative-studio/media-store.ts`) OR dedicated `ctp-assets` prefix in blob storage
- Manifest: `Asset Manifest JSON` on CTP row `{ [assetType]: { url, name, size, uploadedAt } }`

### Implementation sketch

| Step | Detail |
|------|--------|
| Draft token | Issue short-lived token when user enters assets section (or on first file select) |
| Upload | Multipart → validate MIME/size → store → return URL |
| Submit | Include manifest in `discoveryAnswers.asset_uploads` or separate field |
| Studio | Auto-link logo/photos to Creative Studio brand profile when CTP-2C runs |

### Security

- Max file size (e.g. 10MB), allowlist MIME types
- Virus scan out of scope v1; document risk
- No executable uploads; sanitize filenames
- PII in documents — same Airtable access model as CTP row

### Acceptance criteria

- [ ] User selects logo + photos → files upload before submit
- [ ] Thank-you / admin can view uploaded assets
- [ ] Submit payload includes stable URLs in CTP `Payload JSON`
- [ ] Failed upload shows inline error; submit blocked if required asset missing (configurable)

### Effort

**L** (6–10 days) — upload infra, UI state, manifest schema, studio bridge

### Dependencies

- Blob storage env vars (Vercel Blob or existing media storage)
- **CTP-2C** for brand profile auto-link (can ship upload alone first)

---

## Cross-cutting QA strategy

1. **Fixture submit** — script or Playwright path through `/ctp-intake` with discovery payload
2. **Status transitions** — unit tests on `updateCtpSubmission` state machine
3. **Idempotency** — double-submit / double-webhook simulations for 2B and 2C
4. **Launch health** — extend `/api/health/launch` with `ctp.phase2` flags (intake key, blob storage, provision smoke)
5. **Production smoke** — after each package: one real CTP submit in staging, verify Pulse + Airtable + admin links

---

## What Phase 2 explicitly does NOT include

- Replacing Assessments/Proposals pipeline
- New public CTP API parallel to assessment submit
- Clerk auth migration for intake
- Full autonomous workspace **content** generation (only provision + studio campaign shell)
- Client self-scheduling review calendar (manual `Review Scheduled At` field v1)

---

## Suggested PR breakdown

| PR | Package | Title |
|----|---------|-------|
| #45 | 2D | `feat(ctp): post-submit intake agent orchestration` |
| #46 | 2B | `feat(ctp): workspace auto-provision on portal-required submissions` |
| #47 | 2A | `feat(ctp): portal status module` |
| #48 | 2C | `feat(ctp): Creative Studio campaign bridge` |
| #49 | 2E | `feat(ctp): discovery asset upload pipeline` |

Each PR should update this doc’s acceptance checkboxes and run Phase 6 verification from `docs/CTP-ARCHITECTURE.md`.

---

## Ten-year check

| Question | Phase 2 answer |
|----------|----------------|
| Single store? | Yes — `ctp-submissions.ts` gains update helpers, not new tables per feature |
| Pulse-native? | Every transition emits an event |
| Portal chassis? | New module follows `requirePortalModule` |
| Factory alignment? | `ea-ctp` protocol version bump per package |
| Reduces manual EA work? | Intake agent + auto studio + provision |
