# Feature Specification: TB3 v2.2 shared tracking

**Request:** Uploaded owner instructions `Pasted text(20261005-223047).txt`.
**Project/tenant:** Tarris Bouie; persisted organization identity must be verified.
**Owner:** Robert Brickey
**Status:** Preparation; connection access blocked, not implemented or deployed.

## Intent

Public booking inquiries and the private HQ share durable opportunities, calendar events, activity logs, contracts and impact metrics across browsers.

## Scope

- Public booking CTA, form and `/tarris/book`.
- Tenant-authorized APIs, transactional Supabase storage and private PDF access.
- Calendar, opportunity pipeline, earnings, activity forms and Eva read the shared database.
- Academics contacts, transcript storage, eligibility and training notes persist.
- Preserve v2.1 layout, vault interactions and source framing.
- Preview branch only. Production promotion and handoff email remain outside this release.

## Source of truth

Owner attachment above and current v2.1 commit `7dac55c87ecf0f0b79c510d373d1bae376e545af`.
The enumerated locked list contains 16 assets (00–15), despite the count label 15. Preserve the actual existing approved filenames. Vault contains all 16, loads originals only after selection. Storytelling assets remain single-use; vault is the explicit exception. Requested video thumbnails would duplicate assets and no approved videos/city image are supplied, so retain truthful empty media states.

## Protected invariants

- Production deployment, domains, other tenants, payments and contracts/signature routes remain unchanged.
- SECURITY-MODEL.md applies: verified persisted organization, active membership, explicit role, exact tenant matching.
- Public input cannot choose tenant, status, earnings, contract URL or values outcome.
- Preview rows must use a separate workspace key so an existing production database is not polluted.
- No localStorage activity fallback, seeded performance totals, fictional opportunities or fake dates.
- No athlete photos in calendar, earnings, contract or inbox widgets and store.
- Nine navigation items; Settings icon and Eva presence outside navigation.
- Cable source contains no shoes; requirement waived, centered frame. Bench retains full yellow shoes.
- PDF access is authorized, size/type validated and private. No secret keys in client bundles.

## Acceptance criteria

1. Public form submission transaction creates one Inbound opportunity, a tentative hold when a date is provided, values outcome and notification. Missing dates do not fabricate holds.
2. Two independent authenticated browsers show the same saved inquiry, calendar and counts; reload preserves all data.
3. Contracted transition requires nonnegative earnings, confirms hold and updates earnings; Completed preserves a single contribution.
4. Study, workout and community logs create linked calendar records; duration, kids and clinics aggregate actual records without double counting.
5. Month/week/day and upcoming three events use actual timestamps in the user's timezone.
6. Kanban detail, status changes, PDF uploads/downloads, contacts, transcripts, eligibility and Eva commands work against protected APIs.
7. Logged-out private reads/writes and cross-tenant requests fail; public booking remains available.
8. Existing image and vault checks, desktop 1440/mobile 375, scoped TypeScript, build and tenant gates pass.
9. Required screenshots and deployment commit are recorded; preview target is verified and production remains unchanged.

## Verification plan

Exercise API authorization, malformed bodies, transactions, foreign-tenant IDs, idempotency and private-file downloads. Test public booking to private HQ in separate browsers with disposable preview records, clean up only those test records. Run browser checks on the deployed preview and save `hq_v2_2_wired_1440.png`, `hq_v2_2_wired_375.png`, `public_tarris_book_form_1440.png`.

## Rollback condition

Unauthorized private access, cross-tenant writes, failed atomic booking/logging, unverified database target or visual drift blocks release. Restore the v2.1 preview commit; leave production untouched. Do not delete client records during rollback.

## Completion evidence

None for v2.2. Vercel environment metadata lookup returned 403; runtime has no Supabase/Postgres configuration; registry TARRIS tenantId is null. Database target and tenant identity require verified access before application wiring or migration execution.
