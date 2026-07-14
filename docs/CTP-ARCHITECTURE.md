# CTP Architecture — Consider The Possibilities™

**Status:** Implemented July 2026  
**Protocol:** EA Autonomous Architecture & Implementation Protocol + EA Codex Build Protocol  
**Guardrail:** Design the feature to fit the platform — do not force the platform to fit the feature.

---

## Phase 1 — Platform understanding (summary)

CTP is the guided discovery funnel in the EA Intelligence OS:

```
Magnifi/Consider share → /consider/{slug} → /ctp-intake (Discover wizard)
  → POST /api/assessment/submit → Assessments + Proposals + CTP Submissions
  → Pulse (assessment.submitted + ctp.submitted) → Mission Control attention
```

**Reused (never duplicated):**
- Discovery UI (`lib/discovery-engine.ts`, `/discover`)
- Assessment analysis + pricing (`lib/analysis-engine`, `lib/pricing-engine`)
- Airtable Assessments + Proposals pipeline
- Pulse bus + ActivityEvents mirror
- Architect Mode gate (`lib/architect-mode.ts`)
- Consider tracking (`lib/opportunity-tracking.ts`)
- Portal chassis module patterns (future portal CTP status view)

**Not rebuilt:**
- Separate CTP submit API (extends existing assessment submit)
- Parallel auth or session model
- New shell — uses existing intake/thank-you flows

---

## Phase 2 — Architectural decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persistence owner | `lib/ctp-submissions.ts` | First-class CTP lifecycle without forking Assessments schema |
| Submit hook | Extend `/api/assessment/submit` | Single intake path; discovery already posts here |
| Rich discovery data | `Payload JSON` on CTP Submissions | Full Q&A preserved; Assessments stays capacity-focused |
| Events | `ctp.submitted` via `emitPulseEvent` | Unlocks Opportunity Graph `ctp_submission` nodes |
| Attention stats | Query CTP Submissions statuses | Reuses `pulse-attention.ts` templates already written |
| Workspace provisioning | Status field only (Phase 1) | Records intent; Stripe webhook pattern hooks later |
| Protocol registry | `ea-ctp` in `EA_FACTORY_PROTOCOLS` | Factory/EACP can select CTP for discovery builds |

---

## Phase 3 — System design

### Component hierarchy

```
Discover UI
  └── buildSubmissionPayload() → includes discoveryAnswers
Assessment Submit API
  ├── createAssessmentRecord / createProposalRecord (existing)
  └── createCtpSubmission() (when discovery payload detected)
        └── Airtable: CTP Submissions
Pulse Bus
  ├── assessment.submitted
  └── ctp.submitted → ActivityEvents → Opportunity Graph
Mission Control
  └── getCtpAttentionStats() → pulse-attention CTP items
```

### CTP Submissions data model

| Field | Purpose |
|-------|---------|
| Submission ID | Primary key (`CTP-XXXXXXXX`) |
| Status | Lifecycle: Submitted → Workspace Pending → … → Completed |
| Workspace Status | Pending / Provisioning / Active / Failed |
| Studio Status | Not Started → In Progress → Ready For Review |
| Assessment ID / Proposal ID | Links to existing pipeline |
| Payload JSON | `discoveryAnswers`, `desiredExperiences`, `recommendations` |
| Consider Slug / Partner Slug | Funnel attribution |

### Event flow

1. User completes Discover wizard
2. `assessment.submitted` — admin pipeline (unchanged)
3. `ctp.submitted` — metadata includes `ctpSubmissionId`, `flow: ctp`
4. ActivityEvents mirror → Opportunity Graph node type `ctp_submission`

### Security

- Public intake unchanged (rate limits via existing infra)
- Architect Mode still gates Consider revenue/score sections
- CTP records contain PII — Airtable access via existing API key scoping

### Deployment

- Table auto-provision: `POST /api/health/setup-schema` or `node scripts/ops-airtable-ctp-submissions.mjs`
- No new env vars required beyond `AIRTABLE_CTP_SUBMISSIONS_TABLE` (optional override)

---

## Phase 4 — Self review

| Question | Answer |
|----------|--------|
| Simplest solution? | Yes — one store + hook on existing submit |
| Reusable? | Yes — stats, events, Factory protocol |
| Fits EA standards? | Yes — unified Airtable client, Pulse bus, Prompt #000 |
| Increases debt? | No — replaces stub stats and discarded discovery data |
| Improves Orbie? | Compatible — discover guide events unchanged |
| Improves Pulse? | Yes — real CTP events and attention |
| Future portals benefit? | Yes — portal CTP status can read same store |

---

## Phase 5 — Implementation (this release)

- `lib/ctp-submissions.ts` — create, list, detect CTP flow
- `lib/ctp-attention-stats.ts` — real counts from submissions
- `app/api/assessment/submit/route.ts` — CTP record + `ctp.submitted`
- `lib/pulse-bus.ts` — `ctp.submitted` event type
- `lib/ea-factory.ts` — `ea-ctp` protocol
- Airtable schema + meta setup automation
- `docs/CTP-SETUP.md`, ops script

---

## Phase 6 — Verification checklist

- [ ] `npm run build` passes
- [ ] `schema.ctpSubmissions.ok` after setup-schema POST
- [ ] Complete Discover wizard → CTP row in Airtable
- [ ] Pulse shows `ctp.submitted`
- [ ] Mission Control CTP attention items when statuses set
- [ ] Opportunity Graph links CTP events
- [ ] Consider slug tracking still works
- [ ] `/ctp-intake/thank-you` matches discover thank-you

---

## Portal vanity host

| Layer | Status |
|-------|--------|
| Rewrite + `publicPortalUrl()` | **Built** — `lib/ctp-portal-host.ts`, middleware |
| Client CTAs (welcome / exec email / reveal) | **Built** — vanity deep links |
| Admin desk vanity link | **Built** |
| DNS + Vercel domain attach | **Ops** — see `docs/CTP-SETUP.md` → Portal vanity host |

## Future (Phase 4 — scoped)

See **`docs/CTP-PHASE-4-SCOPE.md`**.

| Package | Summary |
|---------|---------|
| CTP-4B | Portal asset gallery on `/portal/[slug]/ctp` |
| CTP-4C | Admin review scheduling + `ctp.review.scheduled` |

---

## Future (Phase 3 — complete)

See **`docs/CTP-PHASE-3-SCOPE.md`**.

| Package | Summary |
|---------|---------|
| CTP-3A | Logo → Creative Studio brand profile bridge |
| CTP-3B | Studio ready-for-review automation + `ctp.studio.ready` |
| CTP-3C | Admin asset viewer for discovery uploads |

---

## Future (Phase 2 — complete)

See **`docs/CTP-PHASE-2-SCOPE.md`** for Phase 2 packages (merged PRs #46–#50).

| Package | Summary |
|---------|---------|
| CTP-2D | Intake agent post-submit orchestration |
| CTP-2B | Workspace auto-provision (`createPortalAccess` pattern) |
| CTP-2A | Portal `/portal/[slug]/ctp` status module |
| CTP-2C | Creative Studio auto-campaign per submission |
| CTP-2E | Binary asset upload for discovery `asset-select` |

---

## Ten-year principle

Every CTP decision routes through the existing EA chassis — Assessments, Pulse, Portal modules, Factory protocols — so maintenance stays centralized as the ecosystem grows.
