# Amanda Catherine public CTA intake wiring: Run 0 contract

Status: implementation contract for the isolated preview branch. No production deployment.

## Boundaries

- Preserve the approved public page design, copy, navigation, imagery and financing placement.
- Preserve the frozen Portal V2 visual system and existing owner navigation.
- Replace only the four primary email CTAs identified in the client review.
- Keep Amanda's email visible as a secondary fallback.
- Public applicants must not enter or see `/portal/amanda-catherine/owner` routes.
- Application forms require no sign-in. Owner queues remain protected.
- Do not guess prices, availability, scheduling, acceptance or payment requirements.

## CTA routing contract

| Public CTA | Public route | Form ID | Portal V2 owner queue | Post-review handoff |
|---|---|---|---|---|
| Apply for Founder Advisory | `/portal/amanda-catherine/apply?form=founder-advisory` | `founder-advisory` | `/portal/amanda-catherine/owner/advisory` | Amanda selects the appropriate consultation or package and sends the approved payment path. |
| Book Amanda to Speak | `/portal/amanda-catherine/apply?form=speaking-media` | `speaking-media` | `/portal/amanda-catherine/owner/speaking` | Amanda confirms fit and availability, then sends a proposal, agreement and payment instructions when applicable. |
| Book a LIFELINE Interview | `/portal/amanda-catherine/apply?form=lifeline-media-guest` | `lifeline-media-guest` | `/portal/amanda-catherine/owner/lifeline` | Guest review, package selection, release, payment when applicable, asset collection and scheduling. |
| Explore a Partnership | `/portal/amanda-catherine/apply?form=partner-vendor-application&program=lifeline` | `partner-vendor-application` | `/portal/amanda-catherine/owner/lifeline` | Partnership review followed by an agreement, sponsorship invoice or decline. |

## Form contracts

### Founder Advisory

- Name, email and optional phone
- Business or organization
- Current stage
- Primary challenge or decision
- Desired outcome
- Preferred engagement: Clarity Session, Strategy Call, 90-Day Strategy Package or guidance requested
- Timeline
- Additional notes

### Speaking and media

- Name, email and optional phone
- Organization
- Event or media format
- Proposed date and location or virtual format
- Audience and estimated attendance
- Requested topic
- Event goals
- Budget range when known
- Additional notes

### LIFELINE interview

- Use the existing `lifeline-media-guest` definition.
- Package, biography, interview topic, promotion links and media-release consent
- Headshot, book/music/brand asset and media release uploads
- Additional notes

### LIFELINE partnership

- Use the existing `partner-vendor-application` definition.
- Organization, partnership type, proposal and event interest
- Proposal/capability document and insurance/agreement uploads when applicable
- Stamp `program=lifeline` in the submission payload
- Additional notes

## Submission contract

Every submission must:

1. POST through `/api/portal/forms/submit` with `slug=amanda-catherine` and `kind=application`.
2. Use a form ID from the approved Amanda form registry.
3. Store the program marker only when it is allowed by the selected form.
4. Persist to the `Portal Form Submissions` store and fail visibly if durable storage is required but unavailable.
5. Emit one, and only one, `portal.form.submitted` activity event.
6. Point the activity destination to the matching protected Portal V2 owner queue.
7. Return a form-specific confirmation and explain the next review step without promising acceptance, availability or payment completion.

## Portal V2 queue contract

- `owner/advisory` shows only `founder-advisory` records.
- `owner/speaking` shows only `speaking-media` records.
- `owner/lifeline` shows `lifeline-media-guest` and LIFELINE-scoped `partner-vendor-application` records.
- Each row shows applicant name, submitted date, contact details, form answers, attachments and status.
- Owner status controls remain `submitted`, `reviewed`, `accepted` and `rejected` in this pass.
- Status mutations require authenticated staff or owner access and tenant scoping.

## Public submission safeguards

- Validate the Amanda portal slug, form ID, allowed fields and maximum field lengths server-side.
- Reject unknown form IDs, unexpected payload keys and oversized submissions.
- Add rate limiting and a bot-trap field without adding visible friction.
- Preserve upload type and size validation already enforced by the asset service.
- Never expose owner routes, private records or applicant data to another applicant.

## Run sequence

- Run 0: lock this contract and baseline tests.
- Run 1: public forms, form definitions, preselection and CTA replacement.
- Run 2: filtered Portal V2 queues and protected status management.
- Run 3: activity routing, owner notification surface, confirmation and post-review handoffs.
- Run 4: safe preview submissions, durable-storage verification, mobile/desktop review and regression tests.

## Completion tests

- Each CTA opens its exact preselected public form without sign-in.
- Each safe preview submission appears only in its matching protected owner queue.
- Every submission generates exactly one owner activity event.
- Applicant confirmation matches the selected workflow.
- Unauthorized users cannot view or change submissions.
- Existing enrollment, learning, Practitioner Kit, book, RIMAN, financing and public navigation behavior remains unchanged.
- Production and the frozen Portal V2 baseline remain untouched until explicit promotion approval.
